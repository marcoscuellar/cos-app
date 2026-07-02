import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getProvider, providerConfigured, ProviderError } from "../lib/server/ai/provider.js";
import { requireUser, unauthorized } from "../lib/server/session.js";

// ─────────────────────────────────────────────────────────────────────────────
// Engine assist — draft a whole engine from a one-line description. Returns the
// tagline, workflow stages, intake inputs, and a complete director system prompt
// so the owner doesn't have to hand-write prompt engineering. Strict JSON.
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM = `You help a founder design a new "engine" — a reusable AI workflow that turns a few inputs into a structured, sourced report (live web research, never fabricate).

Given the engine's NAME and a short DESCRIPTION, output its full configuration.

Reply with ONLY strict, minified JSON — no markdown, no code fences — matching exactly:
{"tagline":string,"stages":string[],"inputs":[{"label":string,"type":"text"|"textarea","required":boolean,"placeholder":string}],"system":string}

- "tagline": one short line on what the engine does.
- "stages": 3-4 short workflow stage names (e.g. "Search","Verify","Score").
- "inputs": 1-3 fields the engine needs before it runs. Use "textarea" for long/multi-line input, "text" for short. Mark the primary one required.
- "system": a complete, disciplined DIRECTOR SYSTEM PROMPT for this engine. It MUST instruct the model to use live web search, never fabricate, cite real sources, and produce a clearly structured markdown report. Use {{DATE}} where today's date belongs. Tailor it specifically to the engine's purpose. Make it strong and detailed.`;

interface Draft {
  tagline: string;
  stages: string[];
  inputs: { key: string; label: string; type: "text" | "textarea"; required: boolean; placeholder: string }[];
  system: string;
}

const slug = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function extractDraft(raw: string): Draft {
  const empty: Draft = { tagline: "", stages: [], inputs: [], system: "" };
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s === -1 || e === -1 || e < s) return empty;
  try {
    const o = JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown>;
    const inputs = Array.isArray(o.inputs)
      ? (o.inputs as Record<string, unknown>[]).slice(0, 3).map((f, i) => {
          const label = typeof f.label === "string" ? f.label : `Input ${i + 1}`;
          return {
            key: slug(label) || `input-${i + 1}`,
            label,
            type: f.type === "text" ? ("text" as const) : ("textarea" as const),
            required: f.required !== false,
            placeholder: typeof f.placeholder === "string" ? f.placeholder : "",
          };
        })
      : [];
    return {
      tagline: typeof o.tagline === "string" ? o.tagline : "",
      stages: Array.isArray(o.stages) ? o.stages.map((x) => String(x)).slice(0, 5) : [],
      inputs,
      system: typeof o.system === "string" ? o.system : "",
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
  if (!(await requireUser(req))) return unauthorized(res);

  const { name, desc } = (req.body ?? {}) as { name?: string; desc?: string };
  const description = typeof desc === "string" ? desc.trim() : "";
  if (!description) return res.status(400).json({ error: "Describe what the engine should do first." });
  if (description.length > 2000) return res.status(413).json({ error: "Keep the description shorter." });

  const user = (name && name.trim() ? `Engine name: ${name.trim()}\n\n` : "") + `Description:\n${description}`;

  try {
    const raw = await getProvider().generate({ system: SYSTEM, user, maxTokens: 2000 });
    return res.status(200).json({ draft: extractDraft(raw) });
  } catch (err) {
    if (err instanceof ProviderError) return res.status(err.status).json({ error: err.message });
    console.error("api/engine-assist failure", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
}
