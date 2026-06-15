import type { Project, ProjectStatus, Accent } from "./types";
import { IS_DEMO } from "./session";

// Client for /api/projects (editable room list) and /api/project-assist (AI draft).
// In the read-only demo nothing reads or writes — the seed data stands as-is.

export interface ProjectCore {
  id?: string;
  name: string;
  status: ProjectStatus;
  why: string;
  nextAction: string;
  lastMovement: string;
}

export interface ProjectAssist {
  why: string;
  nextAction: string;
  nextSteps: string[];
  lastMovement: string;
}

/** Load the owner's saved project list, or null to fall back to the seed data. */
export async function loadProjects(): Promise<Project[] | null> {
  if (IS_DEMO) return null;
  try {
    const r = await fetch("/api/projects");
    if (!r.ok) return null;
    const { projects } = (await r.json()) as { projects?: Project[] | null };
    return Array.isArray(projects) ? projects : null;
  } catch {
    return null;
  }
}

/** Persist the whole project list (best effort — local state is the live copy). */
export async function saveProjects(projects: Project[]): Promise<void> {
  if (IS_DEMO) return;
  try {
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projects }),
      keepalive: true,
    });
  } catch {
    /* best effort */
  }
}

/** Ask COS to draft the context + major next steps from a brain-dump. */
export async function assistProject(name: string, dump: string): Promise<{ assist?: ProjectAssist; error?: string }> {
  if (IS_DEMO) return { error: "This is a read-only demo." };
  try {
    const r = await fetch("/api/project-assist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, dump }),
    });
    const data = (await r.json().catch(() => ({}))) as { assist?: ProjectAssist; error?: string };
    if (!r.ok) return { error: data.error || "Couldn't draft that — try again." };
    return { assist: data.assist };
  } catch {
    return { error: "Network hiccup — try again." };
  }
}

const ACCENTS: Accent[] = ["violet", "mint", "coral", "amber", "blue"];

export const slug = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** Build a full Project from the core fields, filling sensible empty defaults. */
export function makeProject(core: ProjectCore): Project {
  const id = core.id || slug(core.name) || `proj-${Date.now().toString(36)}`;
  return {
    id,
    name: core.name.trim() || "Untitled",
    accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
    status: core.status,
    why: core.why.trim(),
    focus: core.lastMovement.trim() || "Just getting started.",
    lastActivity: "just now",
    lastVerb: "",
    away: "0 days",
    progress: [],
    blockers: [],
    openQuestions: [],
    openDecisions: [],
    nextAction: core.nextAction.trim(),
    due: null,
    lastMovement: core.lastMovement.trim() || "Created this room.",
    notes: [],
    research: [],
    ideasFlow: [],
    pct: 0,
    resume: [],
    counts: { ideas: 0, research: 0, knowledge: 0, files: 0, people: 0, decisions: 0, timeline: 0 },
    decisionsList: [],
    knowledgeList: [],
    peopleList: [],
    archived: false,
  };
}
