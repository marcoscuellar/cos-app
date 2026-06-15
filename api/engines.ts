import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Custom engines — user-authored engines the owner builds in-app. Each carries
// its own director prompt (the "brain"), stored server-side in KV so the runner
// can execute it. The built-in 7 stay in lib/server/engines.ts; these add to them.
//
// Single OWNER for now (one private account behind the passkey), like notes.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER = "me";
const KEY = `engines:${OWNER}`;
const MAX_BYTES = 400_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) return res.status(503).json({ error: "Storage is not configured." });

  try {
    if (req.method === "GET") {
      const engines = await kvGet<unknown[]>(KEY);
      return res.status(200).json({ engines: Array.isArray(engines) ? engines : [] });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const { engines } = (req.body ?? {}) as { engines?: unknown };
      if (!Array.isArray(engines)) return res.status(400).json({ error: "Expected an engines array." });
      const serialized = JSON.stringify(engines);
      if (serialized.length > MAX_BYTES) return res.status(413).json({ error: "Too much to store." });
      await kvSet(KEY, engines);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/engines KV failure", err);
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
