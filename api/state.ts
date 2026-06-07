import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Persisted UI position (auth, route, selected project, theme, sidebar state).
// Stored in Vercel KV, keyed by an opaque per-browser client id. The KV REST
// credentials (KV_REST_API_URL / KV_REST_API_TOKEN) are read from the env that
// Vercel injects — they stay server-side.

const KEY_PREFIX = "cos-state:";
// Client ids are opaque tokens we generate (crypto.randomUUID); keep keys sane.
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

function keyFor(id: unknown): string | null {
  return typeof id === "string" && ID_RE.test(id) ? KEY_PREFIX + id : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(503).json({ error: "Storage is not configured." });
  }

  try {
    if (req.method === "GET") {
      const key = keyFor(req.query.id);
      if (!key) return res.status(400).json({ error: "Missing or invalid id." });
      const state = await kv.get(key);
      return res.status(200).json({ state: state ?? null });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const { id, state } = (req.body ?? {}) as { id?: string; state?: unknown };
      const key = keyFor(id);
      if (!key) return res.status(400).json({ error: "Missing or invalid id." });
      // Cap stored size — this is small UI state, not a document.
      if (JSON.stringify(state ?? null).length > 8192) {
        return res.status(413).json({ error: "State too large." });
      }
      await kv.set(key, state ?? null);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
