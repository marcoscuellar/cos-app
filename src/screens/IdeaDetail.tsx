import { useEffect, useState } from "react";
import { COS_DATA } from "../data";
import type { Idea } from "../types";
import { Eyebrow } from "../components/shared";
import { Icon } from "../components/Icon";

const STAGES = ["Spark", "Brewing", "Exploring", "Testing", "Ready"];

interface IdeaDetailProps {
  idea: Idea;
  onProject: (id: string) => void;
  onBack: () => void;
}

export function IdeaDetail({ idea, onProject, onBack }: IdeaDetailProps) {
  const i = idea;
  const [stageIdx, setStageIdx] = useState(STAGES.indexOf(i.stage));
  const [analyzed, setAnalyzed] = useState(false);
  const [shelved, setShelved] = useState(false);
  useEffect(() => {
    setStageIdx(STAGES.indexOf(i.stage));
    setAnalyzed(false);
    setShelved(false);
  }, [i.id, i.stage]);
  const D = COS_DATA;
  const heatFill = i.heat === "Hot" ? 4 : i.heat === "Warm" ? 3 : 2;
  const isReady = stageIdx >= STAGES.length - 1;

  return (
    <div className="wrap ac-amber">
      <div className="fade-in">
        <button className="back-link" onClick={onBack}><Icon.chevron style={{ width: 15, height: 15 }} /> Ideas</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginTop: 14 }}>
          <div>
            <span className="gold-rule" />
            <Eyebrow accent="amber">Idea · {STAGES[stageIdx]}</Eyebrow>
            <h1 className="disp" style={{ margin: "16px 0 10px", fontSize: "clamp(38px,5vw,60px)", color: "var(--a-amber)" }}>{i.name}</h1>
            <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: "46ch", lineHeight: 1.45 }}>{i.why}</p>
          </div>
        </div>

        {/* status bar */}
        <div className="statusbar" style={{ marginTop: 24 }}>
          <div className="seg">
            <span className="sl">Stage</span>
            <span className="sv"><span className="sd" style={{ background: "var(--a-amber)" }} />{STAGES[stageIdx]}</span>
          </div>
          <div className="seg">
            <span className="sl">Heat</span>
            {analyzed ? (
              <span className="sv" style={{ gap: 9 }}>{i.heat}
                <span className="hbars" style={{ display: "flex", gap: 3 }}>{[0, 1, 2, 3].map((b) => <i key={b} style={{ width: 5, height: 13, borderRadius: 2, background: b < heatFill ? "var(--a-amber)" : "var(--line-3)" }} />)}</span>
              </span>
            ) : (
              <button className="due-set" onClick={() => setAnalyzed(true)}><Icon.spark style={{ width: 14, height: 14 }} /> Analyze</button>
            )}
          </div>
          <div className="seg">
            <span className="sl">Last activity</span>
            <span className="sv" style={{ fontSize: 14 }}>{i.lastActivity}</span>
            <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 500, marginTop: 1 }}>{i.lastMove}</span>
          </div>
        </div>

        {/* stage track + promote */}
        <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div className="track" style={{ flex: 1 }}>
            {STAGES.map((s, idx) => (
              <span key={s} className={"s" + (idx <= stageIdx ? " on" : "")}><span className="pd" />{s}</span>
            ))}
          </div>
          {!isReady ? (
            <button className="btn btn-accent" onClick={() => setStageIdx((x) => Math.min(x + 1, STAGES.length - 1))}>
              Move to {STAGES[stageIdx + 1]} <Icon.arrow />
            </button>
          ) : (
            <button className="btn btn-accent" onClick={() => D.projects[0] && onProject(D.projects[0].id)}>
              Graduate to project <Icon.arrow />
            </button>
          )}
        </div>

        {analyzed && (
          <div className="card ac-amber" style={{ marginBottom: 16, background: "var(--a-amber-bg)", borderColor: "transparent" }}>
            <div className="card-eyebrow" style={{ color: "var(--a-amber)" }}>Heat analysis</div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.01em", color: "var(--ink)" }}>{i.heat} — {i.heatNote}</div>
          </div>
        )}

        <div className="grid-2" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-eyebrow">The spark — where it came from</div>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19, color: "var(--ink-2)", lineHeight: 1.4 }}>"{i.spark}"</div>
            </div>
            <div className="card">
              <div className="card-eyebrow">Open questions · {i.questions.length}</div>
              {i.questions.map((q, idx) => <div key={idx} className="qrow"><span className="qm">?</span>{q}</div>)}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-eyebrow">Related projects</div>
              {i.related.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {i.related.map((r) => {
                    const proj = D.projects.find((p) => p.name === r);
                    return (
                      <button key={r} className={"pill solid ac-" + (proj ? proj.accent : "amber")} style={{ cursor: "pointer", fontWeight: 600 }}
                        onClick={() => proj && onProject(proj.id)}>
                        <span className="d" />{r}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13.5, color: "var(--ink-4)" }}>Not linked to a project yet — it's still its own thing.</div>
              )}
            </div>
            <div className="card">
              <div className="card-eyebrow">Next move</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.015em", color: "var(--ink)", lineHeight: 1.25 }}>{i.nextMove}</div>
            </div>
          </div>
        </div>

        {/* graceful exit */}
        <div className="card" style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          {!shelved ? (
            <>
              <div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, letterSpacing: "-.01em" }}>Not every idea should survive.</div>
                <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 3 }}>Shelving keeps the takeaway as Knowledge, then clears the incubator.</div>
              </div>
              <button className="btn btn-ghost" onClick={() => setShelved(true)}>Shelve with a takeaway</button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="status in-motion"><span className="d" />Shelved</span>
              <span style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Saved the lesson to Knowledge. The incubator has room again.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
