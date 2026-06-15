import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "./data";
import type { Project } from "./types";
import { Sidebar } from "./components/Sidebar";
import { HomeScreen } from "./screens/Home";
import { TodayScreen } from "./screens/Today";
import { TodaySummary } from "./screens/TodaySummary";
import { ConversationScreen } from "./screens/Conversation";
import { HelpScreen } from "./screens/Help";
import { ProjectsScreen } from "./screens/Projects";
import { ProjectScreen } from "./screens/ProjectDetail";
import { IdeasScreen } from "./screens/Ideas";
import { IdeaDetail } from "./screens/IdeaDetail";
import { LabScreen } from "./screens/Lab";
import { AppLock } from "./components/AppLock";
import { SearchScreen } from "./screens/Search";
import { Reentry } from "./overlays/Reentry";
import { loadState, saveState } from "./storage";

type Route = "home" | "today" | "summary" | "projects" | "project" | "ideas" | "idea" | "lab" | "search" | "conversation" | "help";

// Single-user personal app — no authentication. The identity shown in the
// sidebar is static; change it here if you want a different name/email.
const IDENTITY = { name: "You", email: "marcoscuellar99@icloud.com" };

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [reentry, setReentry] = useState<Project | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const [todaySeed, setTodaySeed] = useState("");
  const [convoSeed, setConvoSeed] = useState("");
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
  const goNav = (r: string) => { if (r === "search") setSearchSeed(""); if (r === "today") setTodaySeed(""); setRoute(r as Route); };

  // Front-door command router. If the line names a room ("take me to GLVE",
  // "open Personal Brand", or just "GLVE"), jump straight in. Otherwise hand the
  // whole thing to the AI surface (Search) seeded with the text — that's where
  // "create my day" and "ADHD is kicking my ass…" land for now.
  const onHomeCommand = (text: string) => {
    const t = text.trim().toLowerCase();
    const named = D.projects.find(
      (p) => p.name.toLowerCase() === t || p.id.toLowerCase() === t,
    );
    if (named) { goProject(named.id); return; }
    const nav = t.match(/^(?:take me to|open|go to|jump to|show me|navigate to)\s+(?:my\s+)?(.+?)(?:\s+project)?$/);
    if (nav) {
      const target = nav[1].trim();
      const hit = D.projects.find(
        (p) => p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase()) || p.id.toLowerCase() === target,
      );
      if (hit) { goProject(hit.id); return; }
    }
    // "create my day, I have a gym session and deep work on GLVE…" → hand the
    // brain-dump to the existing Your Day builder and land there as it builds.
    const day = text.trim().match(/^(?:create|build|plan|make|generate)\s+(?:my\s+)?day\b[\s,:.\-–—]*(.*)$/i);
    if (day) { setTodaySeed(day[1].trim()); setRoute("today"); return; }
    // Distress lands in the rescue room (Help); everything else opens into
    // Conversation (the spine).
    if (/adhd|kicking my ass|winning today|overwhelm|can'?t (start|focus)|too much|i'?m stuck|help me start|falling apart|drowning|paraly/i.test(t)) {
      setRoute("help");
      return;
    }
    setConvoSeed(text);
    setRoute("conversation");
  };

  // Hand any text to the Conversation thread (used by Help's actions + input).
  const goTalk = (text: string) => { setConvoSeed(text); setRoute("conversation"); };

  const onProjectClick = (id: string) => {
    const p = D.projects.find((x) => x.id === id);
    if (p && p.status === "dormant") setReentry(p);
    else goProject(id);
  };
  const resumeFromReentry = (id: string) => { setReentry(null); goProject(id); };

  // Avoid a flash before persisted prefs resolve.
  if (!loaded) return <div style={{ height: "100vh", background: "var(--canvas)" }} />;

  // Home is a full-viewport sanctuary with its own minimal rail — render it as a
  // takeover (no app sidebar). The "Take me to my projects" chip is the way back
  // into the rest of the app.
  if (route === "home") {
    return (
      <AppLock>
        <HomeScreen onCommand={onHomeCommand} onNav={goNav} />
      </AppLock>
    );
  }
  if (route === "projects") {
    return (
      <AppLock>
        <ProjectsScreen onProject={goProject} onNav={goNav} />
      </AppLock>
    );
  }

  const project = projectId ? D.projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  // Project room is a redesigned takeover (own rail + folded-in Ask COS).
  if (route === "project" && project) {
    return (
      <AppLock>
        <ProjectScreen project={project} onNav={goNav} />
      </AppLock>
    );
  }
  // Calendar (the day planner) is a full-bleed takeover — no rail, per spec.
  if (route === "today") {
    return (
      <AppLock>
        <TodayScreen onProject={goProject} onNav={goNav} seedDump={todaySeed} onSeedConsumed={() => setTodaySeed("")} />
      </AppLock>
    );
  }
  // Today — the gentle 3-things summary (rail's sun icon).
  if (route === "summary") {
    return (
      <AppLock>
        <TodaySummary onNav={goNav} />
      </AppLock>
    );
  }
  // Conversation — the thread Home opens into.
  if (route === "conversation") {
    return (
      <AppLock>
        <ConversationScreen seed={convoSeed} onNav={goNav} />
      </AppLock>
    );
  }
  // Help — the dark rescue room (where distress lands).
  if (route === "help") {
    return (
      <AppLock>
        <HelpScreen onNav={goNav} onTalk={goTalk} />
      </AppLock>
    );
  }

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
        {route === "ideas" && <IdeasScreen onIdea={goIdea} />}
        {route === "idea" && idea && <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} />}
        {route === "lab" && <LabScreen />}
        {route === "search" && <SearchScreen onProject={goProject} initialQuery={searchSeed} />}
      </main>
      {reentry && <Reentry project={reentry} onClose={() => setReentry(null)} onResume={resumeFromReentry} />}
    </div>
    </AppLock>
  );
}
