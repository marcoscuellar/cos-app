import { useEffect, useState } from "react";
import type { Project, DocRef, Accent } from "../types";
import { Eyebrow, Status } from "../components/shared";
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
  const tabs: [Tab, string, number | null][] = [
    ["context", "Current Context", null],
    ["overview", "Overview", null],
    ["research", "Research", p.research ? p.research.length : 0],
    ["ideas", "Ideas", p.ideasFlow ? p.ideasFlow.length : 0],
  ];
  const [tab, setTab] = useState<Tab>("context");
  // Single source of truth for the due date — shared by Current Context's
  // status bar and the Overview tab (fixes the prototype's split-state gap).
  const [due, setDue] = useState<string | null>(p.due);
  useEffect(() => {
    setTab("context");
    setDue(p.due);
  }, [p.id, p.due]);

  return (
    <div className={"wrap ac-" + p.accent}>
      <div className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <Eyebrow accent={p.accent}>{p.name}</Eyebrow>
            <h1 className="disp" style={{ margin: "16px 0 10px", fontSize: "clamp(38px,5vw,60px)", color: "var(--ac)" }}>{p.name}</h1>
            <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: "46ch", lineHeight: 1.45 }}>{p.why}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn btn-solid" onClick={onAsk}>
                <Icon.spark style={{ width: 15, height: 15 }} /> Ask COS
              </button>
              <button className="btn btn-accent" onClick={onBrainstorm}>
                <Icon.spark style={{ width: 15, height: 15 }} /> Brainstorm with COS
              </button>
            </div>
          </div>
          <Status status={p.status} />
        </div>

        <div className="tabs">
          {tabs.map(([k, label, n]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
              {label}{n ? <span className="tn">{n}</span> : null}
            </button>
          ))}
        </div>

        {tab === "context" && <CurrentContext p={p} due={due} setDue={setDue} onContinue={onContinue} onOpenDoc={onOpenDoc} />}
        {tab === "overview" && <FacetOverview p={p} due={due} />}
        {tab === "research" && <FacetResearch p={p} onOpenDoc={onOpenDoc} />}
        {tab === "ideas" && <FacetIdeasFlow p={p} />}
      </div>
    </div>
  );
}

function StatusBar({ p, due, setDue }: { p: Project; due: string | null; setDue: (d: string) => void }) {
  const dotColor = p.status === "in-motion" ? "var(--a-mint)" : p.status === "blocked" ? "var(--a-amber)" : "var(--ink-4)";
  const statusLabel = p.status === "in-motion" ? "In motion" : p.status === "blocked" ? "Blocked" : "Dormant";
  return (
    <div className="statusbar">
      <div className="seg">
        <span className="sl">Status</span>
        <span className="sv"><span className="sd" style={{ background: dotColor }} />{statusLabel}</span>
      </div>
      <div className={"seg" + (!due ? " warn" : "")}>
        <span className="sl">Due date</span>
        {due ? (
          <span className="sv">{due}</span>
        ) : (
          <button className="due-set" onClick={() => setDue("Jun 21")}>
            <Icon.flag /> Set a due date
          </button>
        )}
      </div>
      <div className="seg">
        <span className="sl">Last movement</span>
        <span className="sv" style={{ fontSize: 14, fontWeight: 600 }}>{p.lastActivity}</span>
        <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 500, marginTop: 1 }}>{p.lastMovement}</span>
      </div>
      <div className="seg">
        <span className="sl">Progress</span>
        <span className="sv" style={{ gap: 10 }}>
          <span className="pbar" style={{ maxWidth: 90 }}><i style={{ width: (p.pct || 0) + "%" }} /></span>
          <span>{(p.pct || 0) + "%"}</span>
        </span>
      </div>
    </div>
  );
}

interface CurrentContextProps {
  p: Project;
  due: string | null;
  setDue: (d: string) => void;
  onContinue: (id: string, fromInside?: boolean) => void;
  onOpenDoc: (doc: DocRef, accent: Accent) => void;
}

function CurrentContext({ p, due, setDue, onContinue, onOpenDoc }: CurrentContextProps) {
  return (
    <div className="fade-in">
      <StatusBar p={p} due={due} setDue={setDue} />

      <div className="card">
        <div className="card-eyebrow">Current focus</div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 24, letterSpacing: "-.02em", lineHeight: 1.15, color: "var(--ink)", maxWidth: "26ch" }}>{p.focus}</div>
        {(p.blockers.length > 0 || p.openQuestions.length > 0) && (
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {p.blockers.map((b, i) => (
              <span key={"b" + i} className="pill" style={{ color: "var(--a-amber)", borderColor: "transparent", background: "var(--a-amber-bg)" }}>
                <span className="d" style={{ background: "var(--a-amber)" }} />{b}
              </span>
            ))}
            {p.openQuestions.length > 0 && (
              <span className="pill"><span className="d" />{p.openQuestions.length} open question{p.openQuestions.length > 1 ? "s" : ""}</span>
            )}
          </div>
        )}
      </div>

      <NotesPanel projectId={p.id} />

      {p.resume && p.resume.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-eyebrow">Pick up where you left off</div>
          {p.resume.map((r, i) => (
            <button key={i} className={"resume-row ac-" + p.accent}
              onClick={() => onOpenDoc({ t: r.t, kind: r.kind, when: r.when, summary: "You were working on this when you last stepped away. Open it to keep going — COS held the thread so you don't have to rebuild it." }, p.accent)}>
              <span className="resume-kind">{r.kind}</span>
              <span className="rt">{r.t}</span>
              <span className="rw">{r.when}</span>
              <Icon.arrow className="ro" />
            </button>
          ))}
        </div>
      )}

      <div className="next">
        <div>
          <div className="nlbl">Next recommended action</div>
          <div className="ntx">{p.nextAction}</div>
        </div>
        <button className="btn btn-solid" onClick={() => onContinue(p.id, true)}>Start <Icon.arrow /></button>
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
