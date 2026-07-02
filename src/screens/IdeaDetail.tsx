import { useState } from "react";
import { COS_DATA } from "../data";
import type { Idea } from "../types";
import { Scaffold, ArrowR } from "../components/CosScaffold";

// Idea detail (redesign) — a sub-page on the shared GLVE-room look: dark identity
// cover (left) + context column (right), the one next move leading.
type Tab = "spark" | "questions" | "related";

interface Props {
  idea: Idea;
  onProject: (id: string) => void;
  onBack: () => void;
  onNav: (route: string) => void;
  onTalk: (text: string) => void;
}

export function IdeaDetail({ idea: i, onProject, onBack, onNav, onTalk }: Props) {
  const D = COS_DATA;
  const [tab, setTab] = useState<Tab>("spark");
  const talk = () => onTalk(`Let's think through my idea "${i.name}". The next move I wrote down is: ${i.nextMove}`);

  return (
    <Scaffold active="bulb" onNav={onNav} initial={(D.user.greetingName || "M")[0]}>
      <div className="room">
        <aside className="room-cover">
          <div className="rc-top">
            <button className="rc-chip" onClick={onBack}>Ōllin</button>
            <div className="rc-top-r">
              <span className="rc-room"><i className="bdot" style={{ background: "var(--gold-bright)" }} />{i.name} · Idea</span>
              <span className="rc-cos">COGNITIVE OPERATING SYSTEM</span>
            </div>
          </div>
          <span className="hd-tick rc-tick" />
          <span className="rc-eyebrow">INCUBATOR</span>
          <h1 className="rc-title">{i.name}</h1>
          <p className="rc-desc">{i.why}</p>
          <div className="rc-meta">
            <div className="rc-row"><span className="rc-k">STAGE</span><span className="rc-v"><i className="bdot" style={{ background: "var(--gold-bright)" }} />{i.stage}</span></div>
            <div className="rc-row"><span className="rc-k">HEAT</span><span className="rc-v">{i.heat}</span></div>
            <div className="rc-row"><span className="rc-k">RELATED</span><span className="rc-v">{i.related.length ? i.related.join(" · ") : "Its own thing"}</span></div>
            <div className="rc-row"><span className="rc-k">LAST MOVE</span><span className="rc-v" style={{ fontWeight: 500 }}>{i.lastMove}</span></div>
          </div>
          <span className="rc-touched">LAST TOUCHED {i.lastActivity.toUpperCase()}</span>
          <div className="rc-btns">
            <button className="rc-edit" onClick={onBack}>Back to ideas</button>
            <button className="rc-tidy" onClick={talk}>Think it through</button>
          </div>
        </aside>

        <section className="room-ctx">
          <div className="ctx-tabs">
            <button className={"tab" + (tab === "spark" ? " is-on" : "")} onClick={() => setTab("spark")}>The Spark</button>
            <button className={"tab" + (tab === "questions" ? " is-on" : "")} onClick={() => setTab("questions")}>Open Questions <sup>{i.questions.length}</sup></button>
            <button className={"tab" + (tab === "related" ? " is-on" : "")} onClick={() => setTab("related")}>Related <sup>{i.related.length}</sup></button>
          </div>

          {tab === "spark" && (
            <>
              <span className="ctx-eyebrow">WHAT SPARKED THIS</span>
              <h2 className="ctx-head">{i.spark}</h2>
              <div className="ctx-next">
                <span className="next-k">● NEXT · THE ONE MOVE</span>
                <div className="next-row">
                  <p className="next-t">{i.nextMove}</p>
                  <button className="next-start" onClick={talk}>Start</button>
                </div>
              </div>
              <div className="ctx-pick">
                <span className="pick-k">HEAT · {i.heat.toUpperCase()}</span>
                <p className="pick-t" style={{ marginTop: 14, fontWeight: 500 }}>{i.heatNote}</p>
              </div>
            </>
          )}

          {tab === "questions" && (
            <div className="ctx-pick" style={{ marginTop: 30 }}>
              <span className="pick-k">OPEN QUESTIONS</span>
              {i.questions.map((q, idx) => (
                <div className="pick-row" key={idx}><span className="pick-tag">Q</span><span className="pick-t">{q}</span></div>
              ))}
            </div>
          )}

          {tab === "related" && (
            <div className="ctx-pick" style={{ marginTop: 30 }}>
              <span className="pick-k">RELATED ROOMS</span>
              {i.related.length ? (
                i.related.map((r) => {
                  const proj = D.projects.find((p) => p.name === r);
                  return (
                    <button className="pick-row" key={r} onClick={() => proj && onProject(proj.id)}>
                      <span className="pick-tag">ROOM</span><span className="pick-t">{r}</span><ArrowR s={15} />
                    </button>
                  );
                })
              ) : (
                <p className="pick-t" style={{ marginTop: 14, fontWeight: 500 }}>Not linked to a project yet — it's still its own thing.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Scaffold>
  );
}
