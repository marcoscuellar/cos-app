import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "./data";
import type { Accent, DocRef, Project, Theme } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./Login";
import { HomeScreen } from "./screens/Home";
import { TodayScreen } from "./screens/Today";
import { ProjectsScreen } from "./screens/Projects";
import { ProjectScreen } from "./screens/ProjectDetail";
import { IdeasScreen } from "./screens/Ideas";
import { IdeaDetail } from "./screens/IdeaDetail";
import { SearchScreen } from "./screens/Search";
import { Reentry } from "./overlays/Reentry";
import { BrainstormPanel } from "./overlays/Brainstorm";
import { DocViewer } from "./overlays/DocViewer";
import { loadState, saveState } from "./storage";

type Route = "home" | "today" | "projects" | "project" | "ideas" | "idea" | "search";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState<Route>("home");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("bold");
  const [collapsed, setCollapsed] = useState(false);
  const [reentry, setReentry] = useState<Project | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [brainstorm, setBrainstorm] = useState<Project | null>(null);
  const [doc, setDoc] = useState<{ d: DocRef; accent: Accent } | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const D = COS_DATA;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Gate persistence until the initial load resolves, so we don't overwrite
  // stored state with defaults on first paint.
  const [loaded, setLoaded] = useState(false);

  // restore position from Vercel KV (falls back to local cache)
  useEffect(() => {
    let active = true;
    loadState().then((s) => {
      if (!active || !s) {
        setLoaded(true);
        return;
      }
      if (s.authed) setAuthed(true);
      if (s.route) setRoute(s.route as Route);
      if (s.projectId) setProjectId(s.projectId);
      if (s.theme) setTheme(s.theme);
      if (s.collapsed) setCollapsed(true);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // persist position
  useEffect(() => {
    if (!loaded) return;
    saveState({ authed, route, projectId, theme, collapsed });
  }, [loaded, authed, route, projectId, theme, collapsed]);

  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [route, projectId, ideaId]);

  const goProject = (id: string) => {
    setProjectId(id);
    setRoute("project");
  };
  const goIdea = (id: string) => {
    setIdeaId(id);
    setRoute("idea");
  };
  const goNav = (r: string) => {
    if (r === "search") setSearchSeed("");
    setRoute(r as Route);
  };

  // "Continue" — dormant / long-absence projects trigger re-entry; active ones go straight in.
  const onContinue = (id: string, fromInside?: boolean) => {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return;
    if (!fromInside && (p.status === "dormant" || p.away === "3 weeks")) {
      setReentry(p);
    } else {
      goProject(id);
    }
  };
  // sidebar / index click — dormant projects greet you with re-entry, active ones open directly.
  const onProjectClick = (id: string) => {
    const p = D.projects.find((x) => x.id === id);
    if (p && p.status === "dormant") setReentry(p);
    else goProject(id);
  };
  const resumeFromReentry = (id: string) => {
    setReentry(null);
    goProject(id);
  };

  if (!authed) return <Login onEnter={() => { setAuthed(true); setRoute("home"); }} />;

  const project = projectId ? D.projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  return (
    <div className="app">
      <Sidebar route={route} projectId={projectId} theme={theme} setTheme={setTheme}
        collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}
        onNav={goNav} onProject={onProjectClick} onAsk={() => goNav("search")} />
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
