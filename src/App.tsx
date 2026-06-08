import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "./data";
import type { Accent, DocRef, Project, Theme } from "./types";
import { Sidebar } from "./components/Sidebar";
import { HomeScreen } from "./screens/Home";
import { TodayScreen } from "./screens/Today";
import { ProjectsScreen } from "./screens/Projects";
import { ProjectScreen } from "./screens/ProjectDetail";
import { IdeasScreen } from "./screens/Ideas";
import { IdeaDetail } from "./screens/IdeaDetail";
import { SearchScreen } from "./screens/Search";
import { Reentry } from "./overlays/Reentry";
import { BrainstormPanel } from "./overlays/Brainstorm";
import { AskCOSPanel } from "./overlays/AskCOS";
import { DocViewer } from "./overlays/DocViewer";
import { loadState, saveState } from "./storage";

type Route = "home" | "today" | "projects" | "project" | "ideas" | "idea" | "search";

// Single-user personal app — no authentication. The identity shown in the
// sidebar is static; change it here if you want a different name/email.
const IDENTITY = { name: "You", email: "marcoscuellar99@icloud.com" };

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("bold");
  const [collapsed, setCollapsed] = useState(false);
  const [reentry, setReentry] = useState<Project | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [brainstorm, setBrainstorm] = useState<Project | null>(null);
  const [askProject, setAskProject] = useState<Project | null>(null);
  const [doc, setDoc] = useState<{ d: DocRef; accent: Accent } | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const [loaded, setLoaded] = useState(false);
  const D = COS_DATA;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Restore UI prefs (route, selected project, theme, sidebar) from KV.
  useEffect(() => {
    let active = true;
    (async () => {
      const s = await loadState();
      if (!active) return;
      if (s) {
        if (s.route) setRoute(s.route as Route);
        if (s.projectId) setProjectId(s.projectId);
        if (s.theme) setTheme(s.theme);
        if (s.collapsed) setCollapsed(true);
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist UI prefs to KV.
  useEffect(() => {
    if (!loaded) return;
    saveState({ route, projectId, theme, collapsed });
  }, [loaded, route, projectId, theme, collapsed]);

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

  // Avoid a flash before persisted prefs resolve.
  if (!loaded) return <div style={{ height: "100vh", background: "var(--canvas)" }} />;

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
        userName={IDENTITY.name}
        userEmail={IDENTITY.email}
        onNav={goNav}
        onProject={onProjectClick}
        onAsk={() => goNav("search")}
      />
      <main className="main" ref={mainRef}>
        {route === "home" && <HomeScreen onProject={goProject} onNav={goNav} onContinue={onContinue} />}
        {route === "today" && <TodayScreen onProject={goProject} />}
        {route === "projects" && <ProjectsScreen onProject={onProjectClick} onContinue={onContinue} />}
        {route === "project" && project && (
          <ProjectScreen project={project} onContinue={onContinue} onBrainstorm={() => setBrainstorm(project)} onAsk={() => setAskProject(project)} onOpenDoc={(d, accent) => setDoc({ d, accent })} />
        )}
        {route === "ideas" && <IdeasScreen onIdea={goIdea} />}
        {route === "idea" && idea && <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} />}
        {route === "search" && <SearchScreen onProject={goProject} initialQuery={searchSeed} />}
      </main>
      {reentry && <Reentry project={reentry} onClose={() => setReentry(null)} onResume={resumeFromReentry} />}
      {brainstorm && <BrainstormPanel project={brainstorm} onClose={() => setBrainstorm(null)} />}
      {askProject && <AskCOSPanel project={askProject} onClose={() => setAskProject(null)} />}
      {doc && <DocViewer doc={doc.d} accent={doc.accent} onClose={() => setDoc(null)} />}
    </div>
  );
}
