import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "./data";
import type { Accent, DocRef, Project } from "./types";
import { Sidebar } from "./components/Sidebar";
import { HomeScreen } from "./screens/Home";
import { TodayScreen } from "./screens/Today";
import { ProjectsScreen } from "./screens/Projects";
import { ProjectScreen } from "./screens/ProjectDetail";
import { IdeasScreen } from "./screens/Ideas";
import { IdeaDetail } from "./screens/IdeaDetail";
import { LabScreen } from "./screens/Lab";
import { AppLock } from "./components/AppLock";
import { SearchScreen } from "./screens/Search";
import { Reentry } from "./overlays/Reentry";
import { BrainstormPanel } from "./overlays/Brainstorm";
import { AskCOSPanel } from "./overlays/AskCOS";
import { DocViewer } from "./overlays/DocViewer";
import { loadState, saveState } from "./storage";

type Route = "home" | "today" | "projects" | "project" | "ideas" | "idea" | "lab" | "search";

// Single-user personal app — no authentication. The identity shown in the
// sidebar is static; change it here if you want a different name/email.
const IDENTITY = { name: "You", email: "marcoscuellar99@icloud.com" };

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [reentry, setReentry] = useState<Project | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [brainstorm, setBrainstorm] = useState<Project | null>(null);
  const [askProject, setAskProject] = useState<Project | null>(null);
  const [doc, setDoc] = useState<{ d: DocRef; accent: Accent } | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const [loaded, setLoaded] = useState(false);
  const D = COS_DATA;

  // Restore UI prefs (route, selected project, sidebar) from KV.
  useEffect(() => {
    let active = true;
    (async () => {
      const s = await loadState();
      if (!active) return;
      if (s) {
        if (s.route) setRoute(s.route as Route);
        if (s.projectId) setProjectId(s.projectId);
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
    saveState({ route, projectId, collapsed });
  }, [loaded, route, projectId, collapsed]);

  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [route, projectId, ideaId]);

  const goProject = (id: string) => { setProjectId(id); setRoute("project"); };
  const goIdea = (id: string) => { setIdeaId(id); setRoute("idea"); };
  const goNav = (r: string) => { if (r === "search") setSearchSeed(""); setRoute(r as Route); };

  // Front-door command router. If the line names a room ("take me to GLVE",
  // "open Personal Brand", or just "GLVE"), jump straight in. Otherwise hand the
  // whole thing to the AI surface (Search) seeded with the text — that's where
  // "create my day" and "ADHD is kicking my ass…" land for now.
  const onHomeCommand = (text: string) => {
    const t = text.trim().toLowerCase();
    const named = D.projects.find(
      (p) => p.name.toLowerCase() === t || p.id.toLowerCase() === t,
    );
    if (named) { onProjectClick(named.id); return; }
    const nav = t.match(/^(?:take me to|open|go to|jump to|show me|navigate to)\s+(?:my\s+)?(.+?)(?:\s+project)?$/);
    if (nav) {
      const target = nav[1].trim();
      const hit = D.projects.find(
        (p) => p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase()) || p.id.toLowerCase() === target,
      );
      if (hit) { onProjectClick(hit.id); return; }
    }
    setSearchSeed(text);
    setRoute("search");
  };

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
    <AppLock>
    <div className="app">
      <Sidebar
        route={route}
        projectId={projectId}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        userName={IDENTITY.name}
        userEmail={IDENTITY.email}
        onNav={goNav}
        onProject={onProjectClick}
        onAsk={() => goNav("search")}
      />
      <main className="main" ref={mainRef}>
        {route === "home" && <HomeScreen onCommand={onHomeCommand} />}
        {route === "today" && <TodayScreen onProject={goProject} />}
        {route === "projects" && <ProjectsScreen onProject={onProjectClick} onContinue={onContinue} />}
        {route === "project" && project && (
          <ProjectScreen project={project} onContinue={onContinue} onBrainstorm={() => setBrainstorm(project)} onAsk={() => setAskProject(project)} onOpenDoc={(d, accent) => setDoc({ d, accent })} />
        )}
        {route === "ideas" && <IdeasScreen onIdea={goIdea} />}
        {route === "idea" && idea && <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} />}
        {route === "lab" && <LabScreen />}
        {route === "search" && <SearchScreen onProject={goProject} initialQuery={searchSeed} />}
      </main>
      {reentry && <Reentry project={reentry} onClose={() => setReentry(null)} onResume={resumeFromReentry} />}
      {brainstorm && <BrainstormPanel project={brainstorm} onClose={() => setBrainstorm(null)} />}
      {askProject && <AskCOSPanel project={askProject} onClose={() => setAskProject(null)} />}
      {doc && <DocViewer doc={doc.d} accent={doc.accent} onClose={() => setDoc(null)} />}
    </div>
    </AppLock>
  );
}
