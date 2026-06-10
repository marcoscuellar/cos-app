import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";
import { getEngine, todayLabel } from "../lib/server/engines.js";

// ─────────────────────────────────────────────────────────────────────────────
// Engine runner. Each engine is a director system prompt run with LIVE web
// search + fetch, so it researches real, current sources and cites them —
// honoring the "never fabricate" rule baked into every engine.
//
// Heavy by design: a run does several web searches + a long Opus generation,
// so give the function generous time and stream to dodge HTTP timeouts.
// ─────────────────────────────────────────────────────────────────────────────

export const config = { maxDuration: 300 };

const OWNER = "me";
const MODEL = process.env.AI_MODEL || "claude-opus-4-8";
const runsKey = (engineId: string) => `engine:runs:${OWNER}:${engineId}`;

interface EngineRun {
  id: string;
  engineId: string;
  inputs: Record<string, string>;
  model: string;
  version: number;
  output: string;
  sources: string[];
  createdAt: number;
  notes?: string;
  starred?: boolean;
}

// Pull every cited/searched URL we can find out of a finished message.
function collectSources(content: unknown[], into: Set<string>) {
  for (const block of content as Record<string, unknown>[]) {
    const cites = block?.citations as Record<string, unknown>[] | undefined;
    if (Array.isArray(cites)) for (const c of cites) if (typeof c?.url === "string") into.add(c.url);
    const inner = block?.content as Record<string, unknown>[] | undefined;
    if (Array.isArray(inner)) for (const r of inner) if (typeof r?.url === "string") into.add(r.url);
  }
}

async function runEngine(systemPrompt: string, userPrompt: string): Promise<{ output: string; sources: string[] }> {
  const client = new Anthropic();
  // Cast: server-tool versions + adaptive thinking may outpace the installed SDK's types.
  const tools = [
    { type: "web_search_20260209", name: "web_search" },
    { type: "web_fetch_20260209", name: "web_fetch" },
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: "user", content: userPrompt }];
  const sources = new Set<string>();
  let output = "";

  for (let i = 0; i < 6; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 20000,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages,
      tools,
    } as any);
    const msg = await stream.finalMessage();
    collectSources(msg.content as unknown[], sources);

    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue; // server-tool loop hit its cap — resume
    }
    output = (msg.content as unknown as Record<string, unknown>[])
      .filter((b) => b.type === "text")
      .map((b) => String(b.text ?? ""))
      .join("")
      .trim();
    break;
  }
  return { output, sources: [...sources].slice(0, 40) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) return res.status(503).json({ error: "Storage is not configured." });

  try {
    if (req.method === "GET") {
      const engineId = String(req.query.engine ?? "");
      if (!engineId) return res.status(400).json({ error: "Missing engine." });
      const runs = (await kvGet<EngineRun[]>(runsKey(engineId))) ?? [];
      return res.status(200).json({ runs });
    }

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as { engineId?: string; runId?: string; notes?: string; starred?: boolean };
      const engineId = String(body.engineId ?? "");
      const runId = String(body.runId ?? "");
      if (!engineId || !runId) return res.status(400).json({ error: "Missing engineId or runId." });
      const runs = (await kvGet<EngineRun[]>(runsKey(engineId))) ?? [];
      const next = runs.map((r) =>
        r.id === runId
          ? {
              ...r,
              notes: typeof body.notes === "string" ? body.notes.slice(0, 4000) : r.notes,
              starred: typeof body.starred === "boolean" ? body.starred : r.starred,
            }
          : r,
      );
      await kvSet(runsKey(engineId), next);
      return res.status(200).json({ runs: next });
    }

    if (req.method === "POST") {
      if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "AI is not configured." });

      const body = (req.body ?? {}) as { engineId?: string; inputs?: Record<string, string>; prompt?: string };
      const engine = getEngine(String(body.engineId ?? ""));
      if (!engine) return res.status(400).json({ error: "Unknown engine." });
      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      if (!prompt) return res.status(400).json({ error: "Give the engine something to run on." });
      if (prompt.length > 8000) return res.status(413).json({ error: "Request too long." });

      const inputs: Record<string, string> = {};
      if (body.inputs && typeof body.inputs === "object") {
        for (const [k, v] of Object.entries(body.inputs)) inputs[String(k).slice(0, 60)] = String(v).slice(0, 2000);
      }

      const system = engine.system.replace(/\{\{DATE\}\}/g, todayLabel());
      const { output, sources } = await runEngine(system, prompt);
      if (!output) return res.status(502).json({ error: "The engine came back empty — try running it again." });

      const run: EngineRun = {
        id: `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        engineId: engine.id,
        inputs,
        model: MODEL,
        version: engine.version,
        output,
        sources,
        createdAt: Date.now(),
      };
      const runs = (await kvGet<EngineRun[]>(runsKey(engine.id))) ?? [];
      const next = [run, ...runs].slice(0, 50);
      await kvSet(runsKey(engine.id), next);
      return res.status(200).json({ run, runs: next });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/engine-run failure", err);
    const message = err instanceof Anthropic.APIError ? err.message : "The engine hit a snag — try again.";
    return res.status(502).json({ error: message });
  }
}
