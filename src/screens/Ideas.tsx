import { useState } from "react";
import { COS_DATA } from "../data";
import { foyerStamp } from "../brief";
import { Icon } from "../components/Icon";

const STAGES = ["Spark", "Brewing", "Exploring", "Testing", "Ready"];

export function IdeasScreen({ onIdea }: { onIdea: (id: string) => void }) {
  const D = COS_DATA;
  // Heat is shown only on demand — never ambient. Tracks which cards revealed it.
  const [analyzed, setAnalyzed] = useState<Record<string, boolean>>({});

  return (
    <div className="wrap room-arch">
      <div className="stagger">
        {/* same calm header as the foyer — a motivational tag + the live stamp */}
        <div className="foyer">
          <div className="foyer-mark"><span className="mono-meta">Dream bigger</span></div>
          <span className="mono-meta q">{foyerStamp()}</span>
        </div>
        <h1 className="arch-hero">Ideas.</h1>

        {/* black banner — same shape as the foyer's doorway */}
        <div className="doorway room-door ac-amber">
          <div className="dw-body">
            <div className="dw-left">
              <div className="dw-rule" />
              <span className="chip">Incubation</span>
              <div className="dw-name">Ideas.</div>
            </div>
            <div className="dw-quotewrap">
              <div className="dw-quote">“If at first the idea is not absurd, then there is no hope for it.”</div>
              <div className="dw-cite">— Albert Einstein</div>
            </div>
          </div>
          <div className="dw-foot">
            <span className="dw-mono">Three ideas at a time. The rest wait as sparks.</span>
          </div>
        </div>

        <div className="grid-3">
          {D.ideas.map((i) => {
            const onIdx = STAGES.indexOf(i.stage);
            const isOn = analyzed[i.id];
            return (
              <div key={i.id} className="card click ac-amber" style={{ display: "flex", flexDirection: "column" }} onClick={() => onIdea(i.id)}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, letterSpacing: "-.02em", color: "var(--a-amber)" }}>{i.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5, minHeight: 58 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink-4)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Why it matters</span>
                  {i.why}
                </div>
                <div className="track" style={{ margin: "14px 0 4px" }}>
                  {STAGES.map((s, idx) => (
                    <span key={s} className={"s" + (idx <= onIdx ? " on" : "")}><span className="pd" />{s}</span>
                  ))}
                </div>
                {isOn ? (
                  <div className="heat">
                    <div className="hl">Heat · analyzed</div>
                    <div className="hv">{i.heat}
                      <span className="hbars">{[0, 1, 2, 3].map((b) => <i key={b} style={{ background: b < (i.heat === "Hot" ? 4 : i.heat === "Warm" ? 3 : 2) ? "var(--a-amber)" : "var(--line-3)" }} />)}</span>
                    </div>
                    <div className="hnote">{i.heatNote}</div>
                  </div>
                ) : (
                  <button className="btn btn-ghost" style={{ marginTop: 14, alignSelf: "flex-start" }} onClick={(e) => { e.stopPropagation(); setAnalyzed({ ...analyzed, [i.id]: true }); }}>
                    <Icon.spark style={{ width: 14, height: 14 }} /> Analyze heat
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="spacer-l" />
        <div className="section-head"><span className="lbl">Sparks · waiting, uncapped</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {D.sparks.map((s, i) => <span key={i} className="pill" style={{ opacity: 0.7 }}><span className="d" />{s}</span>)}
        </div>
      </div>
    </div>
  );
}
