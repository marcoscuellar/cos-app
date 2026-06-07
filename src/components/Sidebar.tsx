import { COS_DATA } from "../data";
import type { Theme } from "../types";
import { Icon } from "./Icon";

interface SidebarProps {
  route: string;
  projectId: string | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
  collapsed: boolean;
  onToggle: () => void;
  onNav: (route: string) => void;
  onProject: (id: string) => void;
  onAsk: () => void;
}

export function Sidebar({ route, projectId, onNav, onProject, onAsk, theme, setTheme, collapsed, onToggle }: SidebarProps) {
  const D = COS_DATA;
  return (
    <aside className={"sb" + (collapsed ? " collapsed" : "")}>
      <div className="sb-mark">
        <div className="cos-logo">COS</div>
        <button className="sb-toggle" onClick={onToggle} title={collapsed ? "Expand" : "Collapse"}><Icon.chevron /></button>
      </div>

      <button className="sb-ask" onClick={onAsk} title="Ask or capture">
        <Icon.search style={{ width: 15, height: 15, stroke: "var(--ink-4)", flexShrink: 0 }} />
        <span className="txt">Ask or capture…</span>
        <kbd>⌘K</kbd>
      </button>

      <nav className="sb-nav">
        <button className={"nav-i" + (route === "home" ? " on" : "")} onClick={() => onNav("home")} title="Now"><Icon.home /> <span className="nav-lbl">Now</span></button>
        <button className={"nav-i" + (route === "today" ? " on" : "")} onClick={() => onNav("today")} title="Today"><Icon.calendar /> <span className="nav-lbl">Today</span></button>
        <button className={"nav-i" + (route === "projects" || route === "project" ? " on" : "")} onClick={() => onNav("projects")} title="Projects"><Icon.projects /> <span className="nav-lbl">Projects</span> <span className="ct">{D.projects.length}</span></button>
        <button className={"nav-i" + (route === "ideas" ? " on" : "")} onClick={() => onNav("ideas")} title="Ideas"><Icon.ideas /> <span className="nav-lbl">Ideas</span> <span className="ct">{D.ideas.length}</span></button>
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
        <div className="theme-tog">
          <button className={theme === "bold" ? "on" : ""} onClick={() => setTheme("bold")}>Bold</button>
          <button className={theme === "mono" ? "on" : ""} onClick={() => setTheme("mono")}>Mono</button>
          <button className={theme === "slate" ? "on" : ""} onClick={() => setTheme("slate")}>Slate</button>
        </div>
        <div className="sb-user">
          <div className="av">F</div>
          <div className="nm">Founder<span>Personal workspace</span></div>
        </div>
      </div>
    </aside>
  );
}
