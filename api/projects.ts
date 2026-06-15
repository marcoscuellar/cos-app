import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Projects — the user's editable room list. The app seeds from src/data.ts; the
// moment the owner edits/adds/archives a project we snapshot the whole list here
// and it becomes the source of truth (survives refresh + device switches).
//
// Single OWNER for now (one private account behind the passkey), same as notes.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER = "me";
const KEY = `projects:${OWNER}`;
const MAX_BYTES = 200_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) return res.status(503).json({ error: "Storage is not configured." });

  try {
    if (req.method === "GET") {
      const projects = await kvGet<unknown[]>(KEY);
      return res.status(200).json({ projects: Array.isArray(projects) ? projects : null });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const { projects } = (req.body ?? {}) as { projects?: unknown };
      if (!Array.isArray(projects)) return res.status(400).json({ error: "Expected a projects array." });
      const serialized = JSON.stringify(projects);
      if (serialized.length > MAX_BYTES) return res.status(413).json({ error: "Too much to store." });
      await kvSet(KEY, projects);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/projects KV failure", err);
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
