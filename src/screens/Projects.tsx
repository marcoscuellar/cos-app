import { COS_DATA } from "../data";
import { Status } from "../components/shared";
import { Icon } from "../components/Icon";
import { foyerStamp } from "../brief";

interface ProjectsProps {
  onProject: (id: string) => void;
  onContinue: (id: string, fromInside?: boolean) => void;
}

export function ProjectsScreen({ onProject, onContinue }: ProjectsProps) {
  const D = COS_DATA;
  return (
    <div className="wrap room-arch">
      <div className="stagger">
        {/* same calm header as the foyer — a motivational tag + the live stamp */}
        <div className="foyer">
          <div className="foyer-mark"><span className="mono-meta">Stay focused</span></div>
          <span className="mono-meta q">{foyerStamp()}</span>
        </div>
        {/* black banner — same shape as the foyer's doorway */}
        <div className="doorway room-door ac-violet">
          <div className="dw-body">
            <div className="dw-left">
              <div className="dw-rule" />
              <span className="chip">The work</span>
              <div className="dw-name">Projects.</div>
            </div>
            <div className="dw-quotewrap">
              <div className="dw-quote">“The main thing is to keep the main thing the main thing.”</div>
              <div className="dw-cite">— Stephen Covey</div>
            </div>
          </div>
          <div className="dw-foot">
            <span className="dw-mono">Five rooms. One focus at a time.</span>
          </div>
        </div>
        {/* project cards — same engine-card language as the Lab: mono eyebrow,
            marker-highlight title, an "Open →" affordance at the foot */}
        <div className="grid-2">
          {D.projects.map((p, i) => (
            <div key={p.id} className={"card project-card ac-" + p.accent}
              onClick={() => (p.status === "dormant" ? onContinue(p.id) : onProject(p.id))}>
              <div className="pc-top">
                <span className="pc-num">{String(i + 1).padStart(2, "0")} · {p.counts.timeline} updates · {p.lastActivity}</span>
                <Status status={p.status} />
              </div>
              <div className="pc-name"><span>{p.name}</span></div>
              <div className="pc-why">{p.why}</div>
              <div className="pc-prog">
                <span className="pbar"><i style={{ width: (p.pct || 0) + "%", background: p.status === "dormant" ? "var(--ink-4)" : "var(--ac)" }} /></span>
                <span className="pc-pct">{p.pct || 0}%</span>
              </div>
              <div className="pc-focus">
                <span className="pc-focus-label">Focus</span>
                <span className="pc-focus-val">{p.focus}</span>
              </div>
              <div className="pc-open">
                {p.status === "dormant" ? "Re-enter project" : "Open project"} <Icon.arrow style={{ width: 13, height: 13 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
