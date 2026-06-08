import type { VercelRequest, VercelResponse } from "@vercel/node";

// Persisted UI position (auth, route, selected project, theme, sidebar state),
// stored in Vercel KV via its REST API (Upstash-compatible). The KV REST
// credentials (KV_REST_API_URL / KV_REST_API_TOKEN) are read from the env that
// Vercel injects and stay server-side — the client only calls this function.
// Uses native fetch directly rather than the deprecated @vercel/kv package.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const KEY_PREFIX = "cos-state:";
// Client ids are opaque tokens we generate (crypto.randomUUID); keep keys sane.
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

function keyFor(id: unknown): string | null {
  return typeof id === "string" && ID_RE.test(id) ? KEY_PREFIX + id : null;
}

/** Run a single Redis command against the KV REST API. */
async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const r = await fetch(KV_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`KV request failed: ${r.status}`);
  const data = (await r.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ error: "Storage is not configured." });
  }

  try {
    if (req.method === "GET") {
      const key = keyFor(req.query.id);
      if (!key) return res.status(400).json({ error: "Missing or invalid id." });
      const raw = await kvCommand(["GET", key]);
      // Values are stored as JSON strings; parse back to the state object.
      let state: unknown = null;
      if (typeof raw === "string") {
        try {
          state = JSON.parse(raw);
        } catch {
          state = null;
        }
      }
      return res.status(200).json({ state });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const { id, state } = (req.body ?? {}) as { id?: string; state?: unknown };
      const key = keyFor(id);
      if (!key) return res.status(400).json({ error: "Missing or invalid id." });
      const serialized = JSON.stringify(state ?? null);
      // Cap stored size — this is small UI state, not a document.
      if (serialized.length > 8192) {
        return res.status(413).json({ error: "State too large." });
      }
      await kvCommand(["SET", key, serialized]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("api/state KV failure", error);
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
