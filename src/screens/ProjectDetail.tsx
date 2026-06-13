import { useEffect, useState } from "react";
import type { Project, DocRef, Accent } from "../types";
import { Icon } from "../components/Icon";
import { NotesPanel } from "../components/Notes";

interface ProjectScreenProps {
  project: Project;
  onContinue: (id: string, fromInside?: boolean) => void;
  onBrainstorm: () => void;
  onAsk: () => void;
  onOpenDoc: (doc: DocRef, accent: Accent) => void;
}

type Tab = "context" | "overview" | "research" | "ideas";

export function ProjectScreen({ project, onContinue, onBrainstorm, onAsk, onOpenDoc }: ProjectScreenProps) {
  const p = project;
  // Single source of truth for the due date — shared by the room status strip
  // and the Overview tab (fixes the prototype's split-state gap).
  const [due, setDue] = useState<string | null>(p.due);
  useEffect(() => { setDue(p.due); }, [p.id, p.due]);

  return (
    <div className={"wrap ac-" + p.accent}>
      <div className="fade-in">
        <ProjectRoom p={p} due={due} setDue={setDue} onContinue={onContinue}
          onBrainstorm={onBrainstorm} onAsk={onAsk} onOpenDoc={onOpenDoc} />
      </div>
    </div>
  );
}

interface RoomProps {
  p: Project;
  due: string | null;
  setDue: (d: string) => void;
  onContinue: (id: string, fromInside?: boolean) => void;
  onBrainstorm: () => void;
  onAsk: () => void;
  onOpenDoc: (doc: DocRef, accent: Accent) => void;
}

// The project "room" — a STATIC black identity panel on the left, and a work
// surface on the right that carries the tabs (Current Context / Overview /
// Research / Ideas) and their content. Editable in place.
function ProjectRoom({ p, due, setDue, onContinue, onBrainstorm, onAsk, onOpenDoc }: RoomProps) {
  const tabs: [Tab, string, number | null][] = [
    ["context", "Current Context", null],
    ["overview", "Overview", null],
    ["research", "Research", p.research ? p.research.length : 0],
    ["ideas", "Ideas", p.ideasFlow ? p.ideasFlow.length : 0],
  ];
  const [tab, setTab] = useState<Tab>("context");
  const [editing, setEditing] = useState(false);
  // Edits overlay the static project for the session.
  const [over, setOver] = useState<{ name?: string; why?: string; focus?: string; nextAction?: string }>({});
  useEffect(() => { setTab("context"); setEditing(false); setOver({}); }, [p.id]);
  const v = { name: over.name ?? p.name, why: over.why ?? p.why, focus: over.focus ?? p.focus, nextAction: over.nextAction ?? p.nextAction };
  const set = (k: keyof typeof over, val: string) => setOver((o) => ({ ...o, [k]: val }));

  const statusLabel = p.status === "in-motion" ? "In motion" : p.status === "blocked" ? "Blocked" : "Dormant";
  const active = (p.openQuestions?.length || 0) + (p.openDecisions?.length || 0);

  return (
    <div className="proom">
      {/* ── static black identity panel ── */}
      <div className="proom-l">
        <div className="proom-top">
          <span className="proom-logo">COS</span>
          <div className="proom-bc">
            <b>{v.name} · Room</b>
            <span>Context Operating System</span>
          </div>
        </div>

        <div>
          <span className="proom-eyebrow">Project room</span>
          {editing ? (
            <input className="proom-in name" value={v.name} onChange={(e) => set("name", e.target.value)} />
          ) : (
            <h1 className="proom-name">{v.name}</h1>
          )}
          {editing ? (
            <textarea className="proom-in tag" rows={2} value={v.why} onChange={(e) => set("why", e.target.value)} />
          ) : (
            <p className="proom-tag">{v.why}</p>
          )}
        </div>

        <div className="proom-status">
          <div className="proom-srow">
            <span className="proom-sl">Status</span>
            <span className="proom-sv"><span className="proom-dot" />{statusLabel}</span>
          </div>
          <div className="proom-srow">
            <span className="proom-sl">Due date</span>
            {due ? <span className="proom-sv">{due}</span>
                 : <button className="proom-sv as-set" onClick={() => setDue("Jun 21")}>Set a date</button>}
          </div>
          <div className="proom-srow">
            <span className="proom-sl">Open threads</span>
            <span className="proom-sv">{active} <span className="muted">active · {p.blockers?.length || 0} blocked</span></span>
          </div>
          <div className="proom-srow">
            <span className="proom-sl">Progress</span>
            <span className="proom-sv"><span className="proom-pbar"><i style={{ width: (p.pct || 0) + "%" }} /></span>{p.pct || 0}%</span>
          </div>
        </div>

        <div className="proom-foot">
          <span className="proom-touched">Last touched {p.lastActivity}</span>
          <div className="proom-acts">
            {editing ? (
              <button className="proom-btn" onClick={() => setEditing(false)}>Done</button>
            ) : (
              <>
                <button className="proom-btn ghost" onClick={() => setEditing(true)}>Edit</button>
                <button className="proom-btn" onClick={onBrainstorm}>Let COS tidy this room</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── work surface: tabs + the active tab's content ── */}
      <div className="proom-r">
        <div className="tabs proom-tabs">
          {tabs.map(([k, label, n]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
              {label}{n ? <span className="tn">{n}</span> : null}
            </button>
          ))}
        </div>

        {tab === "context" && (
          <div className="fade-in">
            <span className="proom-eye">Where you left off</span>
            {editing ? (
              <textarea className="proom-rin leftoff" rows={2} value={v.focus} onChange={(e) => set("focus", e.target.value)} />
            ) : (
              <div className="proom-leftoff">{v.focus}</div>
            )}

            {p.resume && p.resume.length > 0 && (
              <div className="proom-pick">
                <div className="proom-eye">Pick up where you left off</div>
                <div className="proom-pick-rows">
                  {p.resume.map((r, i) => (
                    <button key={i} className="proom-prow"
                      onClick={() => onOpenDoc({ t: r.t, kind: r.kind, when: r.when, summary: "You were working on this when you last stepped away. Open it to keep going — COS held the thread so you don't have to rebuild it." }, p.accent)}>
                      <span className="proom-kind">{r.kind}</span>
                      <span className="proom-pt">{r.t}</span>
                      <span className="proom-pw">{r.when}</span>
                      <Icon.arrow className="ro" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="proom-next">
              <div>
                <div className="proom-next-eye">Next recommended action</div>
                {editing ? (
                  <textarea className="proom-rin" style={{ marginTop: 7 }} rows={2} value={v.nextAction} onChange={(e) => set("nextAction", e.target.value)} />
                ) : (
                  <div className="proom-next-tx">{v.nextAction}</div>
                )}
              </div>
              {!editing && <button className="proom-start" onClick={() => onContinue(p.id, true)}>Start <Icon.arrow /></button>}
            </div>

            {(p.blockers.length > 0 || p.openQuestions.length > 0) && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-eyebrow">Blockers & open questions</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  {p.blockers.map((b, i) => (
                    <span key={"b" + i} className="pill" style={{ color: "var(--gold)", borderColor: "transparent", background: "var(--gold-bg)" }}>
                      <span className="d" style={{ background: "var(--gold)" }} />{b}
                    </span>
                  ))}
                  {p.openQuestions.map((q, i) => (
                    <span key={"q" + i} className="pill"><span className="d" />{q}</span>
                  ))}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onAsk}>
                  <Icon.spark style={{ width: 14, height: 14 }} /> Ask COS about this
                </button>
              </div>
            )}

            <NotesPanel projectId={p.id} projectName={p.name} />
          </div>
        )}
        {tab === "overview" && <FacetOverview p={p} due={due} />}
        {tab === "research" && <FacetResearch p={p} onOpenDoc={onOpenDoc} />}
        {tab === "ideas" && <FacetIdeasFlow p={p} />}
      </div>
    </div>
  );
}

function FacetOverview({ p, due }: { p: Project; due: string | null }) {
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div className="card-eyebrow">The goal — why we're doing this</div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.18, maxWidth: "24ch", color: "var(--ink)" }}>{p.why}</div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-eyebrow">Deadline</div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, letterSpacing: "-.02em", color: due ? "var(--ac)" : "var(--a-coral)" }}>
            {due || "Not set yet"}
          </div>
          {!due && <div style={{ fontSize: 12.5, color: "var(--a-coral)", marginTop: 6, fontWeight: 500 }}>Set one, or this will sit.</div>}
        </div>
        <div className="card">
          <div className="card-eyebrow">Notes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
            {p.notes.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 9, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.45 }}>
                <span style={{ color: "var(--ac)", fontWeight: 700 }}>—</span>{n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacetResearch({ p, onOpenDoc }: { p: Project; onOpenDoc: (doc: DocRef, accent: Accent) => void }) {
  if (!p.research || !p.research.length) return <EmptyFacet label="research" name={p.name} />;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-4)", marginBottom: 4 }}>Tap any item to open the source — COS keeps the summary, the doc lives in your tools.</p>
      {p.research.map((r, i) => (
        <div key={i} className={"card click ac-" + p.accent} style={{ padding: "18px 20px" }}
          onClick={() => onOpenDoc({ t: r.t, kind: "Research", summary: r.d }, p.accent)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div className="card-eyebrow" style={{ margin: 0 }}>Research</div>
            <span style={{ fontSize: 11.5, color: "var(--ac)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>Open <Icon.arrow style={{ width: 13, height: 13, stroke: "var(--ac)" }} /></span>
          </div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.015em", color: "var(--ink)", marginTop: 8 }}>{r.t}</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5 }}>{r.d}</div>
        </div>
      ))}
    </div>
  );
}

function FacetIdeasFlow({ p }: { p: Project }) {
  if (!p.ideasFlow || !p.ideasFlow.length) return <EmptyFacet label="ideas flowing from this project" name={p.name} />;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-4)", marginBottom: 4 }}>Ideas that grew out of {p.name}. Promote one to the incubator when it's ready.</p>
      {p.ideasFlow.map((idea, i) => (
        <div key={i} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--ac)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, letterSpacing: "-.01em", color: "var(--ink)" }}>{idea.name}</span>
          <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "var(--ink-4)" }}>{idea.stage}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyFacet({ label, name }: { label: string; name: string }) {
  return (
    <div className="fade-in card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 20, color: "var(--ink-3)", letterSpacing: "-.01em" }}>No {label} yet</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-4)", marginTop: 8, maxWidth: "38ch", marginInline: "auto" }}>
        When you add {label} to {name}, it shows up here — kept one tab away so Current Context stays first.
      </div>
    </div>
  );
}
