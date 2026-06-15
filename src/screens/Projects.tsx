import { useState } from "react";
import type { Project } from "../types";
import { COS_DATA } from "../data";
import { Scaffold, Header, ArrowR, headerDate } from "../components/CosScaffold";
import { ProjectEditor } from "../components/ProjectEditor";
import { IS_DEMO } from "../session";

// ─────────────────────────────────────────────────────────────────────────────
// Projects (redesign · page 02) — the rooms list, each card a re-entry ramp.
// Now editable: + New project, an Edit button per card, archive + delete via the
// editor. Edits persist to the account (see App + projectsApi).
// ─────────────────────────────────────────────────────────────────────────────

// Short logo chips for the long room names.
const LOGO: Record<string, string> = { glve: "GLVE", cos: "COS", ollin: "ŌLLIN", recruiting: "ROS", brand: "BRAND" };
const STATUS: Record<string, [string, string]> = {
  "in-motion": ["IN MOTION", "st-motion"],
  dormant: ["DORMANT", "st-dormant"],
  blocked: ["BLOCKED", "st-blocked"],
};

interface ProjectsProps {
  projects: Project[];
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  onSave: (p: Project) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}

export function ProjectsScreen({ projects, onProject, onNav, onSave, onDelete, onArchive }: ProjectsProps) {
  // undefined = editor closed · null = creating new · Project = editing that one
  const [editing, setEditing] = useState<Project | null | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);
  const canEdit = !IS_DEMO;

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);

  const card = (p: Project, i: number, isArchived = false) => {
    const [txt, cls] = STATUS[p.status] ?? ["IN MOTION", "st-motion"];
    return (
      <div className="card-wrap" key={p.id}>
        <button className={"card" + (isArchived ? " card-arch" : "")} onClick={() => onProject(p.id)}>
          <div className="card-top">
            <span className="card-num">{String(i + 1).padStart(2, "0")}</span>
            <span className={"badge " + cls}><i className="bdot" />{txt}</span>
          </div>
          <div className="logo">{LOGO[p.id] ?? p.name.toUpperCase()}</div>
          <div className="reentry">
            <div className="re-row"><span className="re-k">LAST</span><span className="re-v">{p.lastMovement}</span></div>
            <div className="re-row"><span className="re-k re-k-next">NEXT</span><span className="re-v re-bold">{p.nextAction}</span></div>
          </div>
          <div className="hairline"><span style={{ width: p.pct + "%" }} /></div>
          <div className="card-foot">
            <span className="foot-time">{p.lastActivity}</span>
            <span className="open">Pick up here <ArrowR s={15} /></span>
          </div>
        </button>
        {canEdit && <button className="pj-edit-btn" onClick={() => setEditing(p)}>Edit</button>}
      </div>
    );
  };

  return (
    <Scaffold active="grid" onNav={onNav} initial={(COS_DATA.user.greetingName || "M")[0]}>
      <Header
        eyebrow="STAY FOCUSED"
        date={headerDate()}
        label="THE WORK"
        title="Projects."
        quote="The main thing is to keep the main thing the main thing."
        author="STEPHEN COVEY"
        sub={`${active.length} ROOMS · ONE FOCUS AT A TIME`}
      />
      {canEdit && (
        <div className="pj-actions">
          <button className="pj-new" onClick={() => setEditing(null)}>+ New project</button>
        </div>
      )}
      <div className="pj-grid">
        {active.map((p, i) => card(p, i))}
      </div>

      {archived.length > 0 && (
        <div className="pj-archived">
          <button className="pj-arch-toggle" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? "Hide archived ▾" : `Archived · ${archived.length} ▸`}
          </button>
          {showArchived && <div className="pj-grid">{archived.map((p, i) => card(p, i, true))}</div>}
        </div>
      )}

      {editing !== undefined && (
        <ProjectEditor
          project={editing ?? undefined}
          onSave={onSave}
          onClose={() => setEditing(undefined)}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      )}
    </Scaffold>
  );
}
