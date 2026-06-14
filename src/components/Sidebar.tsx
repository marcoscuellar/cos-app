import { COS_DATA } from "../data";
import { Icon } from "./Icon";
import { Weather } from "./Weather";

interface SidebarProps {
  route: string;
  projectId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onNav: (route: string) => void;
  onProject: (id: string) => void;
  onAsk: () => void;
  userName: string;
  userEmail: string;
}

// Turn an email into a display name: "marcos.cuellar@cos.app" → "Marcos Cuellar".
function displayName(email: string): string {
  const local = (email.split("@")[0] || email).trim();
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return name || "You";
}

export function Sidebar({ route, projectId, onNav, onProject, onAsk, collapsed, onToggle, userName, userEmail }: SidebarProps) {
  const D = COS_DATA;
  const name = userName.trim() || displayName(userEmail);
  const initial = (name[0] || "?").toUpperCase();
  return (
    <aside className={"sb" + (collapsed ? " collapsed" : "")}>
      <div className="sb-mark">
        <div className="sb-brand">
          <div className="cos-logo">COS</div>
          <span className="sb-tag">Chief of Staff</span>
        </div>
        <button className="sb-toggle" onClick={onToggle} title={collapsed ? "Expand" : "Collapse"}><Icon.chevron /></button>
      </div>

      <button className="sb-ask" onClick={onAsk} title="Ask or capture">
        <Icon.search style={{ width: 15, height: 15, stroke: "var(--ink-4)", flexShrink: 0 }} />
        <span className="txt">Ask or capture…</span>
        <kbd>⌘K</kbd>
      </button>

      <Weather />

      <nav className="sb-nav">
        <button className={"nav-i" + (route === "home" ? " on" : "")} onClick={() => onNav("home")} title="Now"><Icon.home /> <span className="nav-lbl">Now</span></button>
        <button className={"nav-i" + (route === "today" ? " on" : "")} onClick={() => onNav("today")} title="Today"><Icon.calendar /> <span className="nav-lbl">Today</span></button>
        <button className={"nav-i" + (route === "projects" || route === "project" ? " on" : "")} onClick={() => onNav("projects")} title="Projects"><Icon.projects /> <span className="nav-lbl">Projects</span> <span className="ct">{D.projects.length}</span></button>
        <button className={"nav-i" + (route === "ideas" ? " on" : "")} onClick={() => onNav("ideas")} title="Ideas"><Icon.ideas /> <span className="nav-lbl">Ideas</span> <span className="ct">{D.ideas.length}</span></button>
        <button className={"nav-i" + (route === "lab" ? " on" : "")} onClick={() => onNav("lab")} title="Lab"><Icon.lab /> <span className="nav-lbl">Lab</span> <span className="ct">{D.lab.agents.length}</span></button>
        <button className={"nav-i" + (route === "search" ? " on" : "")} onClick={() => onNav("search")} title="Memory"><Icon.memory /> <span className="nav-lbl">Memory</span></button>
      </nav>

      <div className="sb-sec">Projects</div>
      <div className="sb-nav">
        {D.projects.map((p) => (
          <button key={p.id}
            className={"sb-proj ac-" + p.accent + (projectId === p.id && route === "project" ? " on" : "") + (p.status === "dormant" ? " dormant" : "")}
            onClick={() => onProject(p.id)} title={p.name}>
            <span className="dot" /><span className="pname">{p.name}</span>
            {p.status === "dormant" && <span className="st">dormant</span>}
          </button>
        ))}
      </div>

      <div className="sb-foot">
        <div className="sb-user" title={userEmail}>
          <div className="av">{initial}</div>
          <div className="nm">{name}<span>{userEmail}</span></div>
        </div>
      </div>
    </aside>
  );
}
