import { useState } from "react";
import type { Project, ProjectStatus } from "../types";
import { assistProject, makeProject, type ProjectCore } from "../projectsApi";

// ─────────────────────────────────────────────────────────────────────────────
// Project editor — the admin panel behind every "Edit" button. Create, edit,
// archive, or delete a room. The "Help me think this through" button hands a
// brain-dump to COS, which drafts the why + the major next steps.
// ─────────────────────────────────────────────────────────────────────────────

const STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "in-motion", label: "In motion" },
  { id: "dormant", label: "Dormant" },
  { id: "blocked", label: "Blocked" },
];

interface Props {
  project?: Project; // undefined = creating a new room
  onSave: (p: Project) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string, archived: boolean) => void;
}

export function ProjectEditor({ project, onSave, onClose, onDelete, onArchive }: Props) {
  const isNew = !project;
  const [name, setName] = useState(project?.name ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "in-motion");
  const [why, setWhy] = useState(project?.why ?? "");
  const [nextAction, setNextAction] = useState(project?.nextAction ?? "");
  const [lastMovement, setLastMovement] = useState(project?.lastMovement ?? "");
  const [dump, setDump] = useState("");
  const [thinking, setThinking] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const think = async () => {
    const d = dump.trim();
    if (!d || thinking) return;
    setThinking(true);
    setErr(null);
    const { assist, error } = await assistProject(name, d);
    setThinking(false);
    if (error) return setErr(error);
    if (assist) {
      if (assist.why) setWhy(assist.why);
      if (assist.nextAction) setNextAction(assist.nextAction);
      if (assist.lastMovement && !lastMovement.trim()) setLastMovement(assist.lastMovement);
      setSteps(assist.nextSteps ?? []);
    }
  };

  const save = () => {
    if (!name.trim()) return setErr("Give the project a name.");
    const core: ProjectCore = { id: project?.id, name, status, why, nextAction, lastMovement };
    const saved: Project = project
      ? { ...project, name: name.trim(), status, why: why.trim(), nextAction: nextAction.trim(), lastMovement: lastMovement.trim() }
      : makeProject(core);
    onSave(saved);
    onClose();
  };

  return (
    <div className="ed-scrim" onClick={onClose}>
      <div className="ed-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ed-head">
          <span className="ed-eyebrow">{isNew ? "NEW PROJECT" : "EDIT PROJECT"}</span>
          <button className="ed-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="ed-assist">
          <label className="ed-k">Brain-dump it — let COS draft the rest</label>
          <textarea
            className="ed-area"
            rows={3}
            value={dump}
            disabled={thinking}
            placeholder="What is this project, where does it stand, what's on your mind…"
            onChange={(e) => setDump(e.target.value)}
          />
          <button className="ed-think" onClick={think} disabled={thinking || !dump.trim()}>
            {thinking ? "Thinking…" : "✨ Help me think this through"}
          </button>
        </div>

        <label className="ed-k">Name</label>
        <input className="ed-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />

        <label className="ed-k">Status</label>
        <div className="ed-status">
          {STATUSES.map((s) => (
            <button key={s.id} className={"ed-pill" + (status === s.id ? " on" : "")} onClick={() => setStatus(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        <label className="ed-k">Why it matters</label>
        <textarea className="ed-area" rows={2} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="The goal, in one line" />

        <label className="ed-k">Next action — the one thing</label>
        <input className="ed-input" value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="The single most important next step" />

        {steps.length > 0 && (
          <div className="ed-steps">
            <span className="ed-k">COS suggests these next moves — tap one to make it the next action</span>
            {steps.map((s, i) => (
              <button key={i} className="ed-step" onClick={() => setNextAction(s)}>{s}</button>
            ))}
          </div>
        )}

        <label className="ed-k">Last movement</label>
        <input className="ed-input" value={lastMovement} onChange={(e) => setLastMovement(e.target.value)} placeholder="What you last did here" />

        {err && <div className="ed-err">{err}</div>}

        <div className="ed-foot">
          <div className="ed-foot-l">
            {!isNew && onDelete && (
              <button className="ed-del" onClick={() => { onDelete(project!.id); onClose(); }}>Delete</button>
            )}
            {!isNew && onArchive && (
              <button className="ed-arch" onClick={() => { onArchive(project!.id, !project!.archived); onClose(); }}>
                {project!.archived ? "Unarchive" : "Archive"}
              </button>
            )}
          </div>
          <div className="ed-foot-r">
            <button className="ed-cancel" onClick={onClose}>Cancel</button>
            <button className="ed-save" onClick={save}>{isNew ? "Create project" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
