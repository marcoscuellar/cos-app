/* global React */
const { useState, useEffect, useRef } = React;

/* ---------------- icons ---------------- */
const Icon = {
  home: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/></svg>,
  projects: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>,
  ideas: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 1 4 10.5c-.6.5-1 1.2-1 2H9c0-.8-.4-1.5-1-2A6 6 0 0 1 12 3Z"/></svg>,
  memory: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  mic: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>,
  send: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 5 5 9-10"/></svg>,
  spark: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  chevron: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 6-6 6 6 6"/></svg>,
  flag: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>,
  calendar: (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/></svg>,
};

/* ---------------- Sidebar ---------------- */
function Sidebar({ route, projectId, onNav, onProject, onAsk, theme, setTheme, collapsed, onToggle }) {
  const D = window.COS_DATA;
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
            <span className="dot"></span><span className="pname">{p.name}</span>
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

/* ---------------- Chat / mic bar ---------------- */
function ChatBar({ placeholder, big, onFocusNav }) {
  return (
    <div className="chatbar" style={big ? { padding: "18px 20px" } : null}>
      <input placeholder={placeholder || "Ask COS, or capture a thought…"} onFocus={onFocusNav} />
      <button className="mic" title="Voice"><Icon.mic /></button>
      <button className="send" title="Send"><Icon.send /></button>
    </div>
  );
}

/* ---------------- small shared ---------------- */
function Eyebrow({ children, accent }) {
  return <span className={"eyebrow" + (accent ? " ac-" + accent : "")}><span className="d"></span>{children}</span>;
}
function Status({ status }) {
  const label = status === "in-motion" ? "In motion" : status === "blocked" ? "Blocked" : status === "dormant" ? "Dormant" : status;
  return <span className={"status " + status}><span className="d"></span>{label}</span>;
}
function StatGuard({ children }) { return children; }

Object.assign(window, { Icon, Sidebar, ChatBar, Eyebrow, Status, StatGuard });