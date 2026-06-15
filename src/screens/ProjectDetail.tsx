import { useState } from "react";
import type { Project } from "../types";
import { COS_DATA } from "../data";
import { Scaffold, ArrowR } from "../components/CosScaffold";
import { AskCOSPanel } from "../overlays/AskCOS";

// ─────────────────────────────────────────────────────────────────────────────
// Project room (redesign · page 03). Two columns: a dark identity cover (left)
// and the context column (right), re-ordered so the single NEXT action leads —
// then pick-up, then blockers (collapsed until wanted). Ask COS is folded in so
// "Start" works without the legacy app shell. Source: ProjectRoomPage.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = { "in-motion": "In motion", dormant: "Dormant", blocked: "Blocked" };
type Tab = "context" | "overview" | "research" | "ideas";

interface Props {
  project: Project;
  onNav: (route: string) => void;
}

export function ProjectScreen({ project: p, onNav }: Props) {
  const [ask, setAsk] = useState(false);
  const [showBlockers, setShowBlockers] = useState(false);
  const [tab, setTab] = useState<Tab>("context");

  const active = (p.openQuestions?.length || 0) + (p.openDecisions?.length || 0);
  const blocked = p.blockers?.length || 0;
  const initial = (COS_DATA.user.greetingName || "M")[0];

  return (
    <>
      <Scaffold active="grid" onNav={onNav} initial={initial}>
        <div className="room">
          {/* LEFT — dark identity cover */}
          <aside className="room-cover">
            <div className="rc-top">
              <button className="rc-chip" onClick={() => onNav("projects")}>COS</button>
              <div className="rc-top-r">
                <span className="rc-room"><i className="bdot" style={{ background: "var(--gold-bright)" }} />{p.name} · Room</span>
                <span className="rc-cos">CONTEXT OPERATING SYSTEM</span>
              </div>
            </div>
            <span className="hd-tick rc-tick" />
            <span className="rc-eyebrow">PROJECT ROOM</span>
            <h1 className="rc-title">{p.name}</h1>
            <p className="rc-desc">{p.why}</p>
            <div className="rc-meta">
              <div className="rc-row"><span className="rc-k">STATUS</span><span className="rc-v"><i className="bdot" style={{ background: "var(--gold-bright)" }} />{STATUS_LABEL[p.status]}</span></div>
              <div className="rc-row"><span className="rc-k">DUE DATE</span><span className="rc-v">{p.due ?? "—"}</span></div>
              <div className="rc-row"><span className="rc-k">OPEN THREADS</span><span className="rc-v"><b>{active}</b>&nbsp;active · {blocked} blocked</span></div>
              <div className="rc-row"><span className="rc-k">PROGRESS</span><span className="rc-v rc-prog"><span className="rc-bar"><i style={{ width: p.pct + "%" }} /></span>{p.pct}%</span></div>
            </div>
            <span className="rc-touched">LAST TOUCHED {p.lastActivity.toUpperCase()}</span>
            <div className="rc-btns">
              <button className="rc-edit" onClick={() => setAsk(true)}>Edit</button>
              <button className="rc-tidy" onClick={() => setAsk(true)}>Let COS tidy this room</button>
            </div>
          </aside>

          {/* RIGHT — context column (next action leads) */}
          <section className="room-ctx">
            <div className="ctx-tabs">
              <button className={"tab" + (tab === "context" ? " is-on" : "")} onClick={() => setTab("context")}>Current Context</button>
              <button className={"tab" + (tab === "overview" ? " is-on" : "")} onClick={() => setTab("overview")}>Overview</button>
              <button className={"tab" + (tab === "research" ? " is-on" : "")} onClick={() => setTab("research")}>Research <sup>{p.research.length}</sup></button>
              <button className={"tab" + (tab === "ideas" ? " is-on" : "")} onClick={() => setTab("ideas")}>Ideas <sup>{p.ideasFlow.length}</sup></button>
            </div>

            {tab === "context" && (
              <>
                <span className="ctx-eyebrow">WHERE YOU LEFT OFF</span>
                <h2 className="ctx-head">{p.focus}</h2>

                <div className="ctx-next">
                  <span className="next-k">● NEXT · THE ONE THING</span>
                  <div className="next-row">
                    <p className="next-t">{p.nextAction}</p>
                    <button className="next-start" onClick={() => setAsk(true)}>Start</button>
                  </div>
                </div>

                {p.resume.length > 0 && (
                  <div className="ctx-pick">
                    <span className="pick-k">OR PICK UP WHERE YOU LEFT OFF</span>
                    {p.resume.map((r, i) => (
                      <button className="pick-row" key={i} onClick={() => setAsk(true)}>
                        <span className="pick-tag">{r.kind.toUpperCase()}</span>
                        <span className="pick-t">{r.t}</span>
                        <span className="pick-time">{r.when}</span>
                        <ArrowR s={15} />
                      </button>
                    ))}
                  </div>
                )}

                {(blocked > 0 || p.openQuestions.length > 0) && (
                  <div className="ctx-block">
                    <div className="block-head">
                      <span className="pick-k">BLOCKERS &amp; OPEN QUESTIONS</span>
                      <button className="block-toggle" onClick={() => setShowBlockers((s) => !s)}>
                        {showBlockers ? "hide ◂" : "tucked until you need them ▸"}
                      </button>
                    </div>
                    {showBlockers && (
                      <div className="block-pills">
                        {p.blockers.map((b, i) => (
                          <span key={"b" + i} className="bpill bpill-wait"><i className="bdot" style={{ background: "#b58f2e" }} />{b}</span>
                        ))}
                        {p.openQuestions.map((q, i) => (
                          <span key={"q" + i} className="bpill"><i className="bdot" style={{ background: "var(--gold-bright)" }} />{q}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {tab === "overview" && (
              <div className="ctx-pick" style={{ marginTop: 30 }}>
                <span className="pick-k">THE GOAL — WHY WE'RE DOING THIS</span>
                <p className="ctx-head" style={{ fontSize: 24, marginTop: 14 }}>{p.why}</p>
              </div>
            )}
            {tab === "research" && (
              <div className="ctx-pick" style={{ marginTop: 30 }}>
                <span className="pick-k">RESEARCH</span>
                {p.research.map((r, i) => (<div className="pick-row" key={i}><span className="pick-t">{r.t}</span></div>))}
              </div>
            )}
            {tab === "ideas" && (
              <div className="ctx-pick" style={{ marginTop: 30 }}>
                <span className="pick-k">IDEAS FLOWING FROM THIS ROOM</span>
                {p.ideasFlow.map((idea, i) => (<div className="pick-row" key={i}><span className="pick-t">{idea.name}</span><span className="pick-time">{idea.stage}</span></div>))}
              </div>
            )}
          </section>
        </div>
      </Scaffold>
      {ask && <AskCOSPanel project={p} onClose={() => setAsk(false)} />}
    </>
  );
}
