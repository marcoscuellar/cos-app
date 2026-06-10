import type { Note } from "./types";

// Thin client for /api/notes. Every call resolves to the room's full note list
// (newest first) so the UI can just replace its state. Failures resolve to null
// (mutations) or [] (load) — the caller decides how to surface them.

export async function loadNotes(project: string): Promise<Note[]> {
  try {
    const r = await fetch(`/api/notes?project=${encodeURIComponent(project)}`);
    if (!r.ok) return [];
    const { notes } = (await r.json()) as { notes?: Note[] };
    return Array.isArray(notes) ? notes : [];
  } catch {
    return [];
  }
}

export async function addNote(project: string, text: string): Promise<Note[] | null> {
  try {
    const r = await fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, text }),
    });
    if (!r.ok) return null;
    const { notes } = (await r.json()) as { notes?: Note[] };
    return Array.isArray(notes) ? notes : null;
  } catch {
    return null;
  }
}

/** Ask COS to organize a room's raw notes into a clean brief. Raw notes are
 *  never modified — this returns plain text to display alongside them. */
export async function tidyNotes(room: string, notes: string[]): Promise<string | null> {
  try {
    const r = await fetch("/api/tidy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ room, notes }),
    });
    if (!r.ok) return null;
    const { tidied } = (await r.json()) as { tidied?: string };
    return typeof tidied === "string" && tidied.trim() ? tidied.trim() : null;
  } catch {
    return null;
  }
}

export async function deleteNote(project: string, id: string): Promise<Note[] | null> {
  try {
    const r = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, id }),
    });
    if (!r.ok) return null;
    const { notes } = (await r.json()) as { notes?: Note[] };
    return Array.isArray(notes) ? notes : null;
  } catch {
    return null;
  }
}
