import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Notes — the first piece of real, persisted user content.
//
// A note is something you write inside a room ("so-and-so wants to talk about
// X"). It saves to KV and survives refresh, reload, and device switches.
//
// SCALING SEAM: everything is namespaced under a single OWNER for now (the app
// is behind one password = one private user). When the multi-user auth system
// is revived, replace OWNER with the authenticated user's id — the key shape
// `notes:<owner>:<project>` already carries the slot.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER = "me";
const PROJECT_RE = /^[a-z0-9_-]{1,40}$/;
const MAX_TEXT = 4000;
const MAX_NOTES = 300;

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

const keyFor = (project: string): string => `notes:${OWNER}:${project}`;

async function readNotes(project: string): Promise<Note[]> {
  const notes = await kvGet<Note[]>(keyFor(project));
  return Array.isArray(notes) ? notes : [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) {
    return res.status(503).json({ error: "Storage is not configured." });
  }

  try {
    if (req.method === "GET") {
      const project = String(req.query.project ?? "");
      if (!PROJECT_RE.test(project)) return res.status(400).json({ error: "Invalid project." });
      return res.status(200).json({ notes: await readNotes(project) });
    }

    if (req.method === "POST") {
      const { project, text } = (req.body ?? {}) as { project?: string; text?: string };
      if (!project || !PROJECT_RE.test(project)) return res.status(400).json({ error: "Invalid project." });
      const clean = typeof text === "string" ? text.trim() : "";
      if (!clean) return res.status(400).json({ error: "Empty note." });
      if (clean.length > MAX_TEXT) return res.status(413).json({ error: "Note too long." });

      const note: Note = { id: randomUUID(), text: clean, createdAt: Date.now() };
      const notes = [note, ...(await readNotes(project))].slice(0, MAX_NOTES);
      await kvSet(keyFor(project), notes);
      return res.status(200).json({ note, notes });
    }

    if (req.method === "DELETE") {
      const { project, id } = (req.body ?? {}) as { project?: string; id?: string };
      if (!project || !PROJECT_RE.test(project)) return res.status(400).json({ error: "Invalid project." });
      if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id." });
      const notes = (await readNotes(project)).filter((n) => n.id !== id);
      await kvSet(keyFor(project), notes);
      return res.status(200).json({ notes });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/notes KV failure", err);
    return res.status(502).json({ error: "Storage is unavailable right now." });
  }
}
