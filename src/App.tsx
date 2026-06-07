import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "./data";
import type { Accent, DocRef, Project, Theme, User } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./Login";
import { HomeScreen } from "./screens/Home";
import { TodayScreen } from "./screens/Today";
import { ProjectsScreen } from "./screens/Projects";
import { ProjectScreen } from "./screens/ProjectDetail";
import { IdeasScreen } from "./screens/Ideas";
import { IdeaDetail } from "./screens/IdeaDetail";
import { SearchScreen } from "./screens/Search";
import { AdminUsers } from "./screens/AdminUsers";
import { InviteAccept } from "./screens/InviteAccept";
import { Reentry } from "./overlays/Reentry";
import { BrainstormPanel } from "./overlays/Brainstorm";
import { DocViewer } from "./overlays/DocViewer";
import { loadState, saveState } from "./storage";
import { whoami, logout } from "./auth";

type Route = "home" | "today" | "projects" | "project" | "ideas" | "idea" | "search";
const TEST_EMAIL = "test@costhread.app";

export default function App() {
  const path = window.location.pathname;

  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [route, setRoute] = useState<Route>("home");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("bold");
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState("");
  const [reentry, setReentry] = useState<Project | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [brainstorm, setBrainstorm] = useState<Project | null>(null);
  const [doc, setDoc] = useState<{ d: DocRef; accent: Accent } | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const [loaded, setLoaded] = useState(false);
  const D = COS_DATA;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Restore session (token-based) + UI prefs.
  useEffect(() => {
    let active = true;
    (async () => {
      const session = await whoami();
      if (!active) return;
      if (session) {
        setUser(session.user);
        setIsAdmin(session.isAdmin);
        setEmail(session.user.email);
        setAuthed(true);
      }
      const s = await loadState();
      if (!active) return;
      if (s) {
        if (s.route) setRoute(s.route as Route);
        if (s.projectId) setProjectId(s.projectId);
        if (s.theme) setTheme(s.theme);
        if (s.collapsed) setCollapsed(true);
        if (!session && s.email) setEmail(s.email);
      }
      // Tokenless test account: restore + re-validate the 48h window.
      if (!session && s?.authed && (s.email || "").trim().toLowerCase() === TEST_EMAIL) {
        try {
          const r = await fetch(`/api/login?email=${encodeURIComponent(TEST_EMAIL)}`);
          const d = await r.json();
          if (active && !(d && d.expired)) {
            setAuthed(true);
            setUser({ name: "Test User", email: TEST_EMAIL, role: "user", createdAt: 0, active: true, lastLogin: null });
          }
        } catch {
          /* leave as-is */
        }
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist UI prefs (+ authed/email, which the tokenless test account relies on).
  useEffect(() => {
    if (!loaded) return;
    saveState({ authed, route, projectId, theme, collapsed, email });
  }, [loaded, authed, route, projectId, theme, collapsed, email]);

  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [route, projectId, ideaId]);

  const goProject = (id: string) => { setProjectId(id); setRoute("project"); };
  const goIdea = (id: string) => { setIdeaId(id); setRoute("idea"); };
  const goNav = (r: string) => { if (r === "search") setSearchSeed(""); setRoute(r as Route); };

  const onContinue = (id: string, fromInside?: boolean) => {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return;
    if (!fromInside && (p.status === "dormant" || p.away === "3 weeks")) setReentry(p);
    else goProject(id);
  };
  const onProjectClick = (id: string) => {
    const p = D.projects.find((x) => x.id === id);
    if (p && p.status === "dormant") setReentry(p);
    else goProject(id);
  };
  const resumeFromReentry = (id: string) => { setReentry(null); goProject(id); };

  const onAuthed = (u: User) => {
    setUser(u);
    setEmail(u.email);
    setIsAdmin(u.role === "admin");
    setAuthed(true);
    setRoute("home");
  };
  const onSignOut = () => {
    logout();
    setAuthed(false);
    setUser(null);
    setIsAdmin(false);
  };

  // ---- public path: invite acceptance (no auth required) ----
  if (path.startsWith("/invite")) return <InviteAccept />;

  // Avoid a flash of the login screen before the session check resolves.
  if (!loaded) return <div style={{ height: "100vh", background: "var(--canvas)" }} />;

  // ---- admin path ----
  if (path === "/admin/users") {
    if (!authed) return <Login onAuthed={onAuthed} />;
    if (!isAdmin) {
      return (
        <div className="login">
          <div className="login-inner fade-in" style={{ textAlign: "center" }}>
            <div className="lmark" style={{ justifyContent: "center" }}><div className="cos-logo">COS</div></div>
            <h1>Not authorized.</h1>
            <p className="lsub" style={{ marginInline: "auto" }}>This page is for admins only.</p>
            <a className="lbtn" href="/" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>Back to COS</a>
          </div>
        </div>
      );
    }
    return <AdminUsers onBack={() => { window.location.href = "/"; }} />;
  }

  if (!authed) return <Login onAuthed={onAuthed} />;

  const project = projectId ? D.projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  return (
    <div className="app">
      <Sidebar
        route={route}
        projectId={projectId}
        theme={theme}
        setTheme={setTheme}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        userName={user?.name || ""}
        userEmail={email}
        isAdmin={isAdmin}
        onSignOut={onSignOut}
        onNav={goNav}
        onProject={onProjectClick}
        onAsk={() => goNav("search")}
      />
      <main className="main" ref={mainRef}>
        {route === "home" && <HomeScreen onProject={goProject} onNav={goNav} onContinue={onContinue} />}
        {route === "today" && <TodayScreen onProject={goProject} />}
        {route === "projects" && <ProjectsScreen onProject={onProjectClick} onContinue={onContinue} />}
        {route === "project" && project && (
          <ProjectScreen project={project} onContinue={onContinue} onBrainstorm={() => setBrainstorm(project)} onOpenDoc={(d, accent) => setDoc({ d, accent })} />
        )}
        {route === "ideas" && <IdeasScreen onIdea={goIdea} />}
        {route === "idea" && idea && <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} />}
        {route === "search" && <SearchScreen onProject={goProject} initialQuery={searchSeed} />}
      </main>
      {reentry && <Reentry project={reentry} onClose={() => setReentry(null)} onResume={resumeFromReentry} />}
      {brainstorm && <BrainstormPanel project={brainstorm} onClose={() => setBrainstorm(null)} />}
      {doc && <DocViewer doc={doc.d} accent={doc.accent} onClose={() => setDoc(null)} />}
    </div>
  );
}
