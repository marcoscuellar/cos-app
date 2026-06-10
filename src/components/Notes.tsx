import { useEffect, useRef, useState } from "react";
import type { Note } from "../types";
import { loadNotes, addNote, deleteNote, tidyNotes } from "../notesApi";
import { Icon } from "./Icon";

// A note panel for a room. Write a messy thought → it saves to KV → it's still
// here on refresh, reload, and your phone. Optimistic: the note shows instantly
// and reconciles with the server; it rolls back if the save fails.

function relTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotesPanel({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null); // null = loading
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tidied, setTidied] = useState<string | null>(null);
  const [tidying, setTidying] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    setNotes(null);
    setTidied(null);
    loadNotes(projectId).then((n) => alive && setNotes(n));
    return () => {
      alive = false;
    };
  }, [projectId]);

  const tidy = async () => {
    if (!notes || notes.length === 0 || tidying) return;
    setTidying(true);
    const out = await tidyNotes(projectName ?? projectId, notes.map((n) => n.text));
    setTidying(false);
    setTidied(out ?? "Couldn't tidy these just now — try again in a moment.");
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    setFailed(false);
    const optimistic: Note = { id: "tmp-" + Date.now(), text, createdAt: Date.now() };
    setNotes((cur) => [optimistic, ...(cur ?? [])]);
    setDraft("");
    const next = await addNote(projectId, text);
    setSaving(false);
    if (next) {
      setNotes(next);
      setTidied(null); // the tidied view is now stale
    } else {
      // Roll back and hand the text back so nothing is lost.
      setNotes((cur) => (cur ?? []).filter((n) => n.id !== optimistic.id));
      setDraft(text);
      setFailed(true);
    }
    taRef.current?.focus();
  };

  const remove = async (id: string) => {
    const prev = notes;
    setNotes((cur) => (cur ?? []).filter((n) => n.id !== id));
    const next = await deleteNote(projectId, id);
    if (next) setNotes(next);
    else if (prev) setNotes(prev); // restore on failure
  };

  return (
    <div className="card notes-card">
      <div className="card-eyebrow">Notes · saved to this room</div>

      <div className="notes-compose">
        <textarea
          ref={taRef}
          className="notes-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          placeholder="Jot a thought — messy is fine… (⌘↵ to save)"
          rows={2}
        />
        <button className="btn btn-accent notes-save" onClick={submit} disabled={!draft.trim() || saving}>
          {saving ? "Saving…" : "Save"} <Icon.arrow />
        </button>
      </div>

      {failed && <div className="notes-failed">Couldn't save just now — your note is still in the box, try again.</div>}

      {notes && notes.length > 0 && (
        <div className="notes-tools">
          <button className="notes-tidy-btn" onClick={tidy} disabled={tidying}>
            <Icon.spark /> {tidying ? "Tidying…" : "Tidy with COS"}
          </button>
        </div>
      )}

      {tidied && (
        <div className="notes-tidied">
          <div className="tidied-head">
            <span className="card-eyebrow" style={{ margin: 0 }}>COS tidied this up</span>
            <button className="note-del" style={{ opacity: 1 }} title="Close" onClick={() => setTidied(null)}>
              <Icon.x />
            </button>
          </div>
          <div className="tidied-body">{tidied}</div>
        </div>
      )}

      {notes === null ? (
        <div className="notes-empty">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="notes-empty">Nothing yet. Write your first note above — it saves here and stays.</div>
      ) : (
        <div className="notes-list">
          {notes.map((n) => (
            <div key={n.id} className="note-row">
              <span className="note-text">{n.text}</span>
              <span className="note-meta">{relTime(n.createdAt)}</span>
              <button className="note-del" title="Delete note" onClick={() => remove(n.id)}>
                <Icon.x />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
