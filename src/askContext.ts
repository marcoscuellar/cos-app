import type { ActivityItem, Project } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// The COS context engine (client side).
//
// Philosophy: the user should never need to explain context. The workspace IS
// the context. This module turns a workspace (Project) into a structured
// payload that travels with every "Ask Ollin" request, so the user only ever
// supplies the question — never the surrounding situation.
//
// `buildWorkspaceContext` is intentionally a pure function with no UI coupling:
// the same packaged context powers Ask today and every future action
// (Continue, Summarize, Challenge, Plan, Research, Prepare) tomorrow.
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspaceDoc {
  title: string;
  kind?: string;
  summary?: string;
}

export interface WorkspaceDecision {
  title: string;
  detail?: string;
  when?: string;
}

export interface WorkspaceEvent {
  verb: string;
  what: string;
  when: string;
}

/** The structured context payload sent to /api/ask. Pure JSON — no UI types. */
export interface WorkspaceContext {
  title: string;
  description: string;
  status: string;
  focus: string;
  due: string | null;
  progressPct: number;
  notes: string[];
  documents: WorkspaceDoc[];
  ideas: { name: string; stage?: string }[];
  nextAction: string;
  tasks: string[];
  blockers: string[];
  openQuestions: string[];
  openDecisions: string[];
  recentDecisions: WorkspaceDecision[];
  recentActivity: WorkspaceEvent[];
}

const STATUS_LABEL: Record<Project["status"], string> = {
  "in-motion": "In motion",
  blocked: "Blocked",
  dormant: "Dormant",
};

/**
 * Package everything COS knows about a workspace into a single context payload.
 * Recent activity is matched to the workspace by display name (the global
 * activity feed references projects by name, e.g. "GLVE").
 */
export function buildWorkspaceContext(p: Project, activity: ActivityItem[] = []): WorkspaceContext {
  const documents: WorkspaceDoc[] = [
    ...(p.research || []).map((r) => ({ title: r.t, kind: "Research", summary: r.d })),
    ...(p.resume || []).map((r) => ({ title: r.t, kind: r.kind })),
  ];

  const recentActivity: WorkspaceEvent[] = activity
    .filter((a) => a.proj === p.name)
    .map((a) => ({ verb: a.verb, what: a.what, when: a.when }));

  // The headline "last movement" isn't in the activity feed — fold it in so the
  // context always reflects the most recent thing that happened here.
  if (p.lastVerb && p.lastActivity) {
    recentActivity.unshift({ verb: "Last", what: p.lastVerb, when: p.lastActivity });
  }

  return {
    title: p.name,
    description: p.why || "",
    status: STATUS_LABEL[p.status] || p.status,
    focus: p.focus || "",
    due: p.due,
    progressPct: p.pct || 0,
    notes: p.notes || [],
    documents,
    ideas: (p.ideasFlow || []).map((i) => ({ name: i.name, stage: i.stage })),
    nextAction: p.nextAction || "",
    tasks: p.nextAction ? [p.nextAction] : [],
    blockers: p.blockers || [],
    openQuestions: p.openQuestions || [],
    openDecisions: p.openDecisions || [],
    recentDecisions: (p.decisionsList || []).map((d) => ({ title: d.t, detail: d.d, when: d.when })),
    recentActivity,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Action registry — the architectural seam for "Future Actions".
//
// These are NOT separate agents. Each is the same context-aware request with a
// different instruction layered on top of the identical workspace context. V1
// ships only "ask"; adding Summarize/Challenge/Plan/etc. later is a one-line
// entry here plus a button — no new endpoint, no new context plumbing.
// ─────────────────────────────────────────────────────────────────────────────

export type AskActionId =
  | "ask"
  | "continue"
  | "summarize"
  | "challenge"
  | "plan"
  | "research"
  | "prepare";

export interface AskAction {
  id: AskActionId;
  label: string;
  /** Hint shown in the input, when the action drives the request without a typed question. */
  prompt?: string;
}

export const ASK_ACTIONS: AskAction[] = [
  { id: "ask", label: "Ask Ollin" },
  { id: "continue", label: "Continue", prompt: "Pick up where I left off." },
  { id: "summarize", label: "Summarize", prompt: "Summarize where this workspace stands." },
  { id: "challenge", label: "Challenge", prompt: "Pressure-test my thinking here." },
  { id: "plan", label: "Plan", prompt: "Turn this into a concrete plan." },
  { id: "research", label: "Research", prompt: "What should I look into next?" },
  { id: "prepare", label: "Prepare", prompt: "Help me prepare for what's next." },
];

/** Starter questions surfaced in the empty Ask panel. The user can ignore them. */
export const ASK_STARTERS = [
  "What am I forgetting?",
  "What should I focus on next?",
  "What's blocking me?",
  "Summarize where I am.",
];
