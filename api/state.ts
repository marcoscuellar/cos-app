import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";
import { requireUser, unauthorized } from "../lib/server/session.js";

// Persisted UI position (route, selected project, sidebar) for the SIGNED-IN user.
// The user id comes from the session cookie only — never from the request — so a
// browser can only read/write its own account's state. Keyed `user:<uid>:state`.

const stateKey = (uid: string) => `user:${uid}:state`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) return res.status(503).json({ error: "Storage is not configured." });

  const uid = await requireUser(req);
  if (!uid) return unauthorized(res);

  try {
    if (req.method === "GET") {
      const state = await kvGet(stateKey(uid));
      return res.status(200).json({ state: state ?? null });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const { state } = (req.body ?? {}) as { state?: unknown };
      const serialized = JSON.stringify(state ?? null);
      if (serialized.length > 8192) return res.status(413).json({ error: "State too large." });
      await kvSet(stateKey(uid), state ?? null);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("api/state KV failure", error);
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
