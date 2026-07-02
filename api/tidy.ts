import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getProvider, providerConfigured, ProviderError } from "../lib/server/ai/provider.js";
import { requireUser, unauthorized } from "../lib/server/session.js";

// ─────────────────────────────────────────────────────────────────────────────
// Tidy — turn a room's raw, messy notes into a clean brief.
//
// The user's raw notes are never modified; this just returns an organized
// reading of them. Plain-text output (no markdown) so the client can render it
// with white-space:pre-wrap and no markdown dependency.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_INPUT = 12000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!providerConfigured()) {
    return res.status(503).json({ error: "AI is not configured." });
  }
  if (!(await requireUser(req))) return unauthorized(res);

  const { notes, room } = (req.body ?? {}) as { notes?: string[]; room?: string };
  const list = Array.isArray(notes)
    ? notes.filter((n): n is string => typeof n === "string" && n.trim().length > 0).map((n) => n.trim())
    : [];
  if (!list.length) return res.status(400).json({ error: "No notes to tidy." });

  const joined = list.map((n) => `- ${n}`).join("\n").slice(0, MAX_INPUT);
  const roomLabel = typeof room === "string" && room.trim() ? room.trim() : "this room";

  const system = [
    `You are Ollin, tidying a founder's messy personal notes for the "${roomLabel}" room.`,
    `Rewrite them into a clean, organized brief in their own voice. Do NOT invent facts — only organize what's there.`,
    `Group related thoughts under short ALL-CAPS section labels. Pull out action items and people if they appear.`,
    `Format as PLAIN TEXT only — no markdown, no #, no **, no backticks. Use "• " for bullets and "[ ] " for action items.`,
    `Be tight and useful. No preamble, no sign-off.`,
  ].join(" ");

  const user = `Raw notes (newest first):\n\n${joined}`;

  try {
    const tidied = await getProvider().generate({ system, user, maxTokens: 1200 });
    return res.status(200).json({ tidied });
  } catch (err) {
    if (err instanceof ProviderError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("api/tidy failure", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
}
