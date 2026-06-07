import { COS_DATA } from "../data";
import { Eyebrow, Status } from "../components/shared";

interface ProjectsProps {
  onProject: (id: string) => void;
  onContinue: (id: string, fromInside?: boolean) => void;
}

export function ProjectsScreen({ onProject, onContinue }: ProjectsProps) {
  const D = COS_DATA;
  return (
    <div className="wrap">
      <div className="stagger">
        <Eyebrow accent="violet">The work</Eyebrow>
        <h1 className="disp" style={{ margin: "16px 0 8px" }}>Projects</h1>
        <p className="dim" style={{ fontSize: 16, maxWidth: "48ch", marginBottom: 36 }}>
          Five context containers. Everything related to each lives inside it — open one to land on where you left off.
        </p>
        <div className="grid-2">
          {D.projects.map((p) => (
            <div key={p.id} className={"card click ac-" + p.accent}
              onClick={() => (p.status === "dormant" ? onContinue(p.id) : onProject(p.id))}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div className="card-eyebrow" style={{ margin: 0 }}>{p.counts.timeline} updates · {p.lastActivity}</div>
                <Status status={p.status} />
              </div>
              <div className="card-title">{p.name}</div>
              <div className="card-body" style={{ maxWidth: "40ch" }}>{p.why}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 18 }}>
                <span className="pbar"><i style={{ width: (p.pct || 0) + "%", background: p.status === "dormant" ? "var(--ink-4)" : "var(--ac)" }} /></span>
                <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 13, color: "var(--ink-3)", flexShrink: 0 }}>{p.pct || 0}%</span>
              </div>
              <div style={{ borderTop: "1px solid var(--line-2)", marginTop: 16, paddingTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 700 }}>Focus</span>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{p.focus}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
