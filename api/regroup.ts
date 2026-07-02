import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runRegroupMove, detectDistress, type RegroupMode, type RegroupPlan } from "../lib/server/ai/regroup.js";
import { providerConfigured, ProviderError } from "../lib/server/ai/provider.js";

// ─────────────────────────────────────────────────────────────────────────────
// Regroup — HTTP entry point for the rescue flow. Deliberately thin (mirrors
// api/ask.ts): parse the request, delegate to the AI layer, map errors.
//
// Modes:
//   detect                       → { intent: distress | safety | none }
//   cantstart|toomuch|broke|tired → { move, sub }   (computed from the plan)
//
// This app is single-user with no auth (see README); the plan/rooms arrive in
// the request body via the same client-context pattern as api/ask.ts, rather
// than a per-user server store. If the provider is unconfigured we return 503 and
// the client's own offline move (regroup.ts → computeMove) stands unchanged.
//
// PRACTICE: no history/counters/logs — this handler persists nothing about the
// call. Session memory only.
// ─────────────────────────────────────────────────────────────────────────────

const MOVE_MODES: RegroupMode[] = ["cantstart", "toomuch", "broke", "tired"];

interface RegroupBody {
  mode?: string;
  text?: string;
  plan?: RegroupPlan;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!providerConfigured()) {
    // The client always has a deterministic offline move; nothing breaks.
    return res.status(503).json({ error: "AI is not configured." });
  }

  const body = (req.body ?? {}) as RegroupBody;
  const mode = typeof body.mode === "string" ? body.mode : "";

  try {
    if (mode === "detect") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return res.status(400).json({ error: "No text provided." });
      const intent = await detectDistress(text);
      return res.status(200).json({ intent });
    }

    if (MOVE_MODES.includes(mode as RegroupMode)) {
      const result = await runRegroupMove(mode as RegroupMode, body.plan ?? {});
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "Unknown mode." });
  } catch (err) {
    if (err instanceof ProviderError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unexpected error." });
  }
}
