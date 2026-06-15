import { COS_DATA } from "../data";
import { Scaffold, Header, ArrowR, headerDate } from "../components/CosScaffold";

// ─────────────────────────────────────────────────────────────────────────────
// Projects (redesign · page 02) — the rooms list, re-tuned so each card is a
// re-entry ramp (where you left off + the one next step), not a status board.
// No "% done", no update counts. Source: COS Page Concepts.html + ProjectsPage.
// ─────────────────────────────────────────────────────────────────────────────

// Short logo chips for the long room names.
const LOGO: Record<string, string> = { glve: "GLVE", cos: "COS", ollin: "ŌLLIN", recruiting: "ROS", brand: "BRAND" };
const STATUS: Record<string, [string, string]> = {
  "in-motion": ["IN MOTION", "st-motion"],
  dormant: ["DORMANT", "st-dormant"],
  blocked: ["BLOCKED", "st-blocked"],
};

interface ProjectsProps {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
}

export function ProjectsScreen({ onProject, onNav }: ProjectsProps) {
  const projects = COS_DATA.projects;
  return (
    <Scaffold active="grid" onNav={onNav} initial={(COS_DATA.user.greetingName || "M")[0]}>
      <Header
        eyebrow="STAY FOCUSED"
        date={headerDate()}
        label="THE WORK"
        title="Projects."
        quote="The main thing is to keep the main thing the main thing."
        author="STEPHEN COVEY"
        sub={`${projects.length} ROOMS · ONE FOCUS AT A TIME`}
      />
      <div className="pj-grid">
        {projects.map((p, i) => {
          const [txt, cls] = STATUS[p.status] ?? ["IN MOTION", "st-motion"];
          return (
            <button className="card" key={p.id} onClick={() => onProject(p.id)}>
              <div className="card-top">
                <span className="card-num">{String(i + 1).padStart(2, "0")}</span>
                <span className={"badge " + cls}><i className="bdot" />{txt}</span>
              </div>
              <div className="logo">{LOGO[p.id] ?? p.name.toUpperCase()}</div>
              <div className="reentry">
                <div className="re-row"><span className="re-k">LAST</span><span className="re-v">{p.lastMovement}</span></div>
                <div className="re-row"><span className="re-k re-k-next">NEXT</span><span className="re-v re-bold">{p.nextAction}</span></div>
              </div>
              <div className="hairline"><span style={{ width: p.pct + "%" }} /></div>
              <div className="card-foot">
                <span className="foot-time">{p.lastActivity}</span>
                <span className="open">Pick up here <ArrowR s={15} /></span>
              </div>
            </button>
          );
        })}
      </div>
    </Scaffold>
  );
}
