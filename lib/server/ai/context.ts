// ─────────────────────────────────────────────────────────────────────────────
// Workspace context — the wire contract + renderer.
//
// The context BUILDER lives on the client (src/askContext.ts: buildWorkspaceContext)
// because it reads the live workspace. This module owns the server-side half:
// the shape that arrives over the wire, and how it's rendered into prompt text.
// Context-building logic is never duplicated — only the JSON contract crosses
// the boundary, exactly as the existing /api handlers do.
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

/** The structured context payload produced by buildWorkspaceContext on the client. */
export interface WorkspaceContext {
  title?: string;
  description?: string;
  status?: string;
  focus?: string;
  due?: string | null;
  progressPct?: number;
  notes?: string[];
  documents?: WorkspaceDoc[];
  ideas?: { name: string; stage?: string }[];
  nextAction?: string;
  tasks?: string[];
  blockers?: string[];
  openQuestions?: string[];
  openDecisions?: string[];
  recentDecisions?: WorkspaceDecision[];
  recentActivity?: WorkspaceEvent[];
}

function section(label: string, lines: string[]): string {
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  if (!clean.length) return "";
  return `${label}:\n${clean.map((l) => `- ${l}`).join("\n")}\n`;
}

/** Render the structured context into a readable, labeled block for any provider. */
export function renderContext(c: WorkspaceContext): string {
  const meta: string[] = [];
  if (c.status) meta.push(`Status: ${c.status}`);
  if (c.focus) meta.push(`Current focus: ${c.focus}`);
  if (c.due) meta.push(`Due: ${c.due}`);
  if (typeof c.progressPct === "number") meta.push(`Progress: ${c.progressPct}%`);

  let out = `WORKSPACE: ${c.title || "Untitled workspace"}\n`;
  if (c.description) out += `What it's for: ${c.description}\n`;
  if (meta.length) out += meta.join(" · ") + "\n";
  out += "\n";

  out += section("Notes", c.notes || []);
  out += section(
    "Documents",
    (c.documents || []).map(
      (d) => `${d.kind ? `[${d.kind}] ` : ""}${d.title}${d.summary ? ` — ${d.summary}` : ""}`,
    ),
  );
  out += section("Ideas", (c.ideas || []).map((i) => `${i.name}${i.stage ? ` (${i.stage})` : ""}`));
  out += section("Next action", c.nextAction ? [c.nextAction] : []);
  out += section("Open tasks / questions", [...(c.tasks || []), ...(c.openQuestions || [])]);
  out += section("Blockers", c.blockers || []);
  out += section("Open decisions", c.openDecisions || []);
  out += section(
    "Recent decisions",
    (c.recentDecisions || []).map(
      (d) => `${d.title}${d.detail ? ` — ${d.detail}` : ""}${d.when ? ` (${d.when})` : ""}`,
    ),
  );
  out += section(
    "Recent activity",
    (c.recentActivity || []).map((a) => `${a.verb} ${a.what}${a.when ? ` (${a.when})` : ""}`),
  );
  return out.trim();
}
