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
import { LabScreen } from "./screens/Lab";
import { SearchScreen } from "./screens/Search";
import { Reentry } from "./overlays/Reentry";
import { BrainstormPanel } from "./overlays/Brainstorm";
import { AskCOSPanel } from "./overlays/AskCOS";
import { DocViewer } from "./overlays/DocViewer";
import { Regroup } from "./overlays/Regroup";
import { PlanProvider } from "./plan";
import { detectIntent, type RegroupMode } from "./regroup";
import { loadState, saveState } from "./storage";

// State passed to the Regroup takeover when it opens (session-only; never stored).
interface RegroupState {
  mode?: RegroupMode | null;
  preValidated?: boolean;
  safety?: boolean;
  text?: string;
}

type Route = "home" | "today" | "projects" | "project" | "ideas" | "idea" | "lab" | "search";

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
  const [regroup, setRegroup] = useState<RegroupState | null>(null);
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

  // ── Regroup orchestration ────────────────────────────────────────────────
  // Entry points (all three converge here): the persistent "Stuck?" pill,
  // distress detected in the input bar, and voice — which routes its transcript
  // through the exact same detection.
  const openRegroup = (opts: RegroupState = {}) => setRegroup(opts);

  // Free-text from any input (typed or dictated) is screened for distress before
  // it runs the normal ask/capture flow. Safety language always wins.
  const handleUserInput = async (text: string) => {
    const local = detectIntent(text);
    if (local === "safety") return openRegroup({ safety: true, text });
    if (local === "distress") return openRegroup({ preValidated: true, text });
    // Server-side intent check — the fallback for phrasing the keyword list misses.
    try {
      const res = await fetch("/api/regroup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "detect", text }),
      });
      if (res.ok) {
        const { intent } = (await res.json()) as { intent?: string };
        if (intent === "safety") return openRegroup({ safety: true, text });
        if (intent === "distress") return openRegroup({ preValidated: true, text });
      }
    } catch {
      /* offline — fall through to normal capture */
    }
    // Not distress → treat it as an ask/capture: seed Memory search with it.
    setSearchSeed(text);
    setRoute("search");
  };

  // Avoid a flash before persisted prefs resolve.
  if (!loaded) return <div style={{ height: "100vh", background: "var(--canvas)" }} />;

  const project = projectId ? D.projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  return (
    <PlanProvider>
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
          {route === "home" && <HomeScreen onProject={goProject} onNav={goNav} onRegroup={(m) => openRegroup({ mode: m })} onInput={handleUserInput} />}
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

        {/* Persistent "Stuck?" pill — gold, bottom-right, on every screen.
            Never a badge, never a count: a rescue must not keep score. */}
        {!regroup && (
          <button className="stuck-pill" onClick={() => openRegroup({})} title="Regroup">
            <span className="sp-dot" />Stuck?
          </button>
        )}

        {reentry && <Reentry project={reentry} onClose={() => setReentry(null)} onResume={resumeFromReentry} />}
        {brainstorm && <BrainstormPanel project={brainstorm} onClose={() => setBrainstorm(null)} />}
        {askProject && <AskCOSPanel project={askProject} onClose={() => setAskProject(null)} />}
        {doc && <DocViewer doc={doc.d} accent={doc.accent} onClose={() => setDoc(null)} />}
        {regroup && (
          <Regroup
            onClose={() => setRegroup(null)}
            initialMode={regroup.mode ?? null}
            preValidated={regroup.preValidated}
            safety={regroup.safety}
            triggerText={regroup.text}
            onStepIn={goProject}
          />
        )}
      </div>
    </PlanProvider>
  );
}
