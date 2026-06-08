export type Accent = "violet" | "mint" | "coral" | "amber" | "blue";
// The Research Lab ships its own richer palette (mapped to ac-* tokens in CSS).
export type LabAccent =
  | "violet" | "amber" | "blue"
  | "indigo" | "green" | "rose" | "teal";
export type ProjectStatus = "in-motion" | "blocked" | "dormant";
export type IdeaStage = "Spark" | "Brewing" | "Exploring" | "Testing" | "Ready";
export type Theme = "bold" | "mono" | "slate";

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
}

/** A document opened in the DocViewer drawer. */
export interface DocRef {
  t: string;
  kind: string;
  when?: string;
  source?: string;
  summary: string;
}
