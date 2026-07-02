import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";
import { requireUser, unauthorized } from "../lib/server/session.js";

// ─────────────────────────────────────────────────────────────────────────────
// Custom engines — engines the signed-in user builds in-app, each carrying its
// own director prompt. Private per account; keyed `user:<uid>:engines`. The
// built-in 7 stay in lib/server/engines.ts; these add to them.
// ─────────────────────────────────────────────────────────────────────────────

const keyFor = (uid: string) => `user:${uid}:engines`;
const MAX_BYTES = 400_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) return res.status(503).json({ error: "Storage is not configured." });

  const uid = await requireUser(req);
  if (!uid) return unauthorized(res);

  try {
    if (req.method === "GET") {
      const engines = await kvGet<unknown[]>(keyFor(uid));
      return res.status(200).json({ engines: Array.isArray(engines) ? engines : [] });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const { engines } = (req.body ?? {}) as { engines?: unknown };
      if (!Array.isArray(engines)) return res.status(400).json({ error: "Expected an engines array." });
      const serialized = JSON.stringify(engines);
      if (serialized.length > MAX_BYTES) return res.status(413).json({ error: "Too much to store." });
      await kvSet(keyFor(uid), engines);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/engines KV failure", err);
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
