import { useState } from "react";
import { COS_DATA } from "../data";
import { foyerStamp } from "../brief";
import { Icon } from "../components/Icon";

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
        {/* black banner — same shape as the foyer's doorway */}
        <div className="doorway room-door light ac-amber">
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

        {/* same card template as Projects: number, marker name, tagline, mono meta row, Open → */}
        <div className="grid-3">
          {D.ideas.map((idea, idx) => {
            const isOn = analyzed[idea.id];
            return (
              <div key={idea.id} className="card project-card ac-amber" onClick={() => onIdea(idea.id)}>
                <div className="pc-top">
                  <span className="pc-num">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="status">{idea.stage}</span>
                </div>
                <div className="pc-name"><span>{idea.name}</span></div>
                <div className="pc-why">{idea.why}</div>
                <div className="eng-stages">
                  {isOn ? (
                    <span className="eng-stage">Heat · {idea.heat}</span>
                  ) : (
                    <button className="eng-stage stage-link" onClick={(e) => { e.stopPropagation(); setAnalyzed({ ...analyzed, [idea.id]: true }); }}>
                      Analyze heat
                    </button>
                  )}
                </div>
                <div className="pc-open">
                  Open idea <Icon.arrow style={{ width: 13, height: 13 }} />
                </div>
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
