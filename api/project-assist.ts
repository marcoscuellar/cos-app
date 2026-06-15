import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getProvider, providerConfigured, ProviderError } from "../lib/server/ai/provider.js";

// ─────────────────────────────────────────────────────────────────────────────
// Project assist — give COS a rough brain-dump about a project and it gathers
// the context into clean fields + proposes the major next steps. Used by the
// project editor's "Help me think this through". Returns strict JSON.
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM = `You are COS, a calm, sharp chief-of-staff. The founder gives you a rough brain-dump about a project. Distill it.

Reply with ONLY strict, minified JSON — no markdown, no prose, no code fences — matching exactly:
{"why":string,"nextAction":string,"nextSteps":string[],"lastMovement":string}

- "why": one crisp sentence on why this project matters / its goal.
- "nextAction": the single most important next thing to do — imperative and concrete.
- "nextSteps": 3-5 major next steps in sensible order, each a short imperative phrase.
- "lastMovement": one short phrase for what was most recently done; infer from the dump, or "Created this room." if unknowable.

Stay grounded in what they wrote. Never invent specific facts, names, dates, or numbers.`;

function extractJson(raw: string): { why: string; nextAction: string; nextSteps: string[]; lastMovement: string } {
  const empty = { why: "", nextAction: "", nextSteps: [] as string[], lastMovement: "" };
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s === -1 || e === -1 || e < s) return empty;
  try {
    const o = JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown>;
    return {
      why: typeof o.why === "string" ? o.why : "",
      nextAction: typeof o.nextAction === "string" ? o.nextAction : "",
      nextSteps: Array.isArray(o.nextSteps) ? o.nextSteps.map((x) => String(x)).slice(0, 5) : [],
      lastMovement: typeof o.lastMovement === "string" ? o.lastMovement : "",
    };
  } catch {
    return empty;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!providerConfigured()) return res.status(503).json({ error: "AI is not configured." });

  const { name, dump } = (req.body ?? {}) as { name?: string; dump?: string };
  const brief = typeof dump === "string" ? dump.trim() : "";
  if (!brief) return res.status(400).json({ error: "Tell me a bit about the project first." });
  if (brief.length > 4000) return res.status(413).json({ error: "That's a lot — trim it down a little." });

  const user = (name && name.trim() ? `Project: ${name.trim()}\n\n` : "") + `Brain-dump:\n${brief}`;

  try {
    const raw = await getProvider().generate({ system: SYSTEM, user, maxTokens: 700 });
    return res.status(200).json({ assist: extractJson(raw) });
  } catch (err) {
    if (err instanceof ProviderError) return res.status(err.status).json({ error: err.message });
    console.error("api/project-assist failure", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
}
