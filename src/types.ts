export type Accent = "violet" | "mint" | "coral" | "amber" | "blue";
// The Research Lab ships its own richer palette (mapped to ac-* tokens in CSS).
export type LabAccent =
  | "violet" | "amber" | "blue"
  | "indigo" | "green" | "rose" | "teal";
export type ProjectStatus = "in-motion" | "blocked" | "dormant";
export type IdeaStage = "Spark" | "Brewing" | "Exploring" | "Testing" | "Ready";
export type Theme = "bold" | "mono" | "slate";

/** A note the user writes inside a room — persisted to KV, newest first. */
export interface Note {
  id: string;
  text: string;
  createdAt: number;
}

/** A single scheduled block produced by the brain-dump day planner. */
export interface PlannedBlock {
  start: string;
  end: string;
  title: string;
  kind: string;
  proj: string | null;
  walkIn?: string;
}

/** Today's AI-built plan, persisted per day. */
export interface DayPlan {
  dump: string;
  blocks: PlannedBlock[];
  deferred: string[];
  /** The one directive line for the day — shown in the black box, editable. */
  intention?: string;
  note?: string;
  createdAt: number;
}

export interface ResumeItem {
  kind: string;
  t: string;
  when: string;
}

export interface ResearchItem {
  t: string;
  d: string;
}

export interface IdeaFlowItem {
  name: string;
  stage: string;
}

export interface DecisionItem {
  t: string;
  d: string;
  when: string;
}

export interface KnowledgeItem {
  t: string;
  d: string;
  used: string;
}

export interface PersonItem {
  n: string;
  r: string;
  initials: string;
}

export interface ProjectCounts {
  ideas: number;
  research: number;
  knowledge: number;
  files: number;
  people: number;
  decisions: number;
  timeline: number;
}

export interface Project {
  id: string;
  name: string;
  accent: Accent;
  status: ProjectStatus;
  why: string;
  focus: string;
  lastActivity: string;
  lastVerb: string;
  away: string;
  progress: string[];
  blockers: string[];
  openQuestions: string[];
  openDecisions: string[];
  nextAction: string;
  due: string | null;
  lastMovement: string;
  notes: string[];
  research: ResearchItem[];
  ideasFlow: IdeaFlowItem[];
  pct: number;
  resume: ResumeItem[];
  counts: ProjectCounts;
  decisionsList: DecisionItem[];
  knowledgeList: KnowledgeItem[];
  peopleList: PersonItem[];
}

export interface Idea {
  id: string;
  name: string;
  stage: IdeaStage;
  why: string;
  heat: "Hot" | "Warm" | "Cooling";
  heatNote: string;
  questions: string[];
  related: string[];
  lastActivity: string;
  lastMove: string;
  spark: string;
  nextMove: string;
}

export interface CalendarBlock {
  start: string;
  end: string;
  title: string;
  kind: "ritual" | "focus" | "meeting";
  proj: string | null;
  walkIn: string;
  who?: string;
}

export interface Today {
  date: string;
  calendar: string;
  blocks: CalendarBlock[];
}

export interface ActivityItem {
  proj: string;
  accent: Accent;
  verb: string;
  what: string;
  when: string;
}

export interface SearchPerson {
  n: string;
  r: string;
  proj: string;
  initials: string;
}

export interface SearchKnowledge {
  t: string;
  d: string;
  used: string;
}

export interface SearchDecision {
  t: string;
  used: string;
}

/* ---------------- Research Lab ----------------
   A quiet research department working on the founder's behalf. */
export interface LabAgent {
  initials: string;
  name: string;
  accent: LabAccent;
  status: "field" | "reporting" | "idle";
  assignment: string;
  finding: string;
  last: string;
}

export interface LabExperiment {
  name: string;
  accent: LabAccent;
  state: "active" | "paused" | "done";
  q: string;
  note: string;
}

export interface LabShelf {
  name: string;
  accent: LabAccent;
  count: number;
  sample: string;
}

export interface LabReport {
  t: string;
  kind: string;
  when: string;
  fresh: boolean;
  d: string;
}

export interface Lab {
  agents: LabAgent[];
  experiments: LabExperiment[];
  shelves: LabShelf[];
  reports: LabReport[];
}

/* The architectural doorway on Home: a date-seeded CEO/founder quote
   and the standing motto. The room name is the COS project itself. */
export interface CeoQuote {
  t: string;
  who: string;
  role: string;
}
export interface Doorway {
  quotes: CeoQuote[];
  motto: string;
}

export interface COSData {
  user: { name: string; initials: string; greetingName: string };
  today: Today;
  projects: Project[];
  ideas: Idea[];
  sparks: string[];
  activity: ActivityItem[];
  searchPeople: SearchPerson[];
  searchKnowledge: SearchKnowledge[];
  searchDecisions: SearchDecision[];
  lab: Lab;
  doorway: Doorway;
}

/** A document opened in the DocViewer drawer. */
export interface DocRef {
  t: string;
  kind: string;
  when?: string;
  source?: string;
  summary: string;
}

// ── Engines — repeatable AI pipelines that turn messy input into real work ──

/** One input an engine asks for before it runs. */
export interface EngineField {
  key: string;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
}

/** Client-facing engine definition (drives the picker + the intake form). */
export interface EngineDef {
  id: string;
  num: number;
  name: string;
  tagline: string;
  accent: LabAccent;
  inputs: EngineField[];
  stages: string[];
}

/** A single saved run — the durable record of inputs, what ran, and the output. */
export interface EngineRun {
  id: string;
  engineId: string;
  inputs: Record<string, string>;
  model: string;
  version: number;
  /** The engine's report, as markdown (tables, pillars, etc.). */
  output: string;
  /** Source URLs the engine cited via live web search. */
  sources: string[];
  createdAt: number;
  notes?: string;
  starred?: boolean;
  /** True when run as a fast draft (no web search). */
  draft?: boolean;
}
