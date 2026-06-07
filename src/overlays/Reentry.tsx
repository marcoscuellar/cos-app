import type { Project } from "../types";
import { Icon } from "../components/Icon";

interface ReentryProps {
  project: Project;
  onClose: () => void;
  onResume: (id: string) => void;
}

export function Reentry({ project, onClose, onResume }: ReentryProps) {
  const p = project;
  // Re-entry depth scales with how long you've been away.
  const tier =
    p.away === "3 weeks"
      ? "Briefing"
      : p.away === "3 days" || p.away === "1 day" || p.away === "2 days" || p.away === "5 days"
      ? "Nudge"
      : "Reconstruction";
  const changed = [
    "No new activity while you were away — the thread is exactly as you left it.",
    "2 related notes from other projects mention this.",
  ];
  return (
    <div className="overlay" onClick={onClose}>
      <div className={"reentry ac-" + p.accent} onClick={(e) => e.stopPropagation()}>
        <div className="rtop">
          <span className="away">Away {p.away}</span>
          <button className="rx" onClick={onClose}><Icon.x /></button>
        </div>
        <h2>Welcome back to {p.name}.</h2>
        <div className="tier"><span className="d" />{tier} · depth scales with time away</div>

        {tier !== "Nudge" && (
          <div className="rsec">
            <div className="rl">What changed while you were away</div>
            {changed.map((c, i) => <div key={i} className="changed"><span className="cd" />{c}</div>)}
          </div>
        )}
        {tier === "Reconstruction" && (
          <div className="rsec">
            <div className="rl">Why this mattered</div>
            <div className="rv">{p.why}</div>
          </div>
        )}
        <div className="rsec">
          <div className="rl">Where you stopped</div>
          <div className="rv"><b>{p.focus}</b> You were {p.lastVerb}.</div>
        </div>
        <div className="rsec">
          <div className="rl">Pick up with</div>
          <div className="rv"><b>{p.nextAction}</b></div>
        </div>

        <div className="ractions">
          <button className="btn btn-accent" onClick={() => onResume(p.id)}>Pick up where you left off <Icon.arrow /></button>
          <button className="btn btn-ghost" onClick={() => onResume(p.id)}>Just browsing</button>
          {p.status === "dormant" && <button className="btn btn-ghost" onClick={onClose}>Let it rest</button>}
        </div>
      </div>
    </div>
  );
}
