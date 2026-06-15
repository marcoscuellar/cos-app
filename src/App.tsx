import { useEffect, useState } from "react";
import { COS_DATA } from "./data";
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
import { DemoBadge } from "./components/DemoBadge";
import { SearchScreen } from "./screens/Search";
import { loadState, saveState } from "./storage";
import { IS_DEMO } from "./session";

type Route = "home" | "today" | "summary" | "projects" | "project" | "ideas" | "idea" | "lab" | "search" | "conversation" | "help";

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const [todaySeed, setTodaySeed] = useState("");
  const [convoSeed, setConvoSeed] = useState("");
  const [loaded, setLoaded] = useState(false);
  const D = COS_DATA;

  // Restore UI prefs (route, selected project) from KV.
  useEffect(() => {
    let active = true;
    (async () => {
      const s = await loadState();
      if (!active) return;
      if (s) {
        if (s.route) setRoute(s.route as Route);
        if (s.projectId) setProjectId(s.projectId);
      }
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  // Persist UI prefs to KV.
  useEffect(() => {
    if (!loaded) return;
    saveState({ route, projectId });
  }, [loaded, route, projectId]);

  const goProject = (id: string) => { setProjectId(id); setRoute("project"); };
  const goIdea = (id: string) => { setIdeaId(id); setRoute("idea"); };
  const goNav = (r: string) => { if (r === "search") setSearchSeed(""); if (r === "today") setTodaySeed(""); setRoute(r as Route); };
  const goTalk = (text: string) => { setConvoSeed(text); setRoute("conversation"); };

  // Front-door command router. Names a room → jump in; "create my day…" → the
  // Calendar builder; distress → the Help rescue room; everything else opens
  // into Conversation (the spine).
  const onHomeCommand = (text: string) => {
    const t = text.trim().toLowerCase();
    const named = D.projects.find((p) => p.name.toLowerCase() === t || p.id.toLowerCase() === t);
    if (named) { goProject(named.id); return; }
    const nav = t.match(/^(?:take me to|open|go to|jump to|show me|navigate to)\s+(?:my\s+)?(.+?)(?:\s+project)?$/);
    if (nav) {
      const target = nav[1].trim();
      const hit = D.projects.find(
        (p) => p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase()) || p.id.toLowerCase() === target,
      );
      if (hit) { goProject(hit.id); return; }
    }
    const day = text.trim().match(/^(?:create|build|plan|make|generate)\s+(?:my\s+)?day\b[\s,:.\-–—]*(.*)$/i);
    if (day) { setTodaySeed(day[1].trim()); setRoute("today"); return; }
    if (/adhd|kicking my ass|winning today|overwhelm|can'?t (start|focus)|too much|i'?m stuck|help me start|falling apart|drowning|paraly/i.test(t)) {
      setRoute("help");
      return;
    }
    setConvoSeed(text);
    setRoute("conversation");
  };

  // Avoid a flash before persisted prefs resolve.
  if (!loaded) return <div style={{ height: "100vh", background: "#faf9f5" }} />;

  const project = projectId ? D.projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  // Every screen is a full-viewport redesigned takeover with its own rail.
  let screen;
  if (route === "projects") screen = <ProjectsScreen onProject={goProject} onNav={goNav} />;
  else if (route === "project" && project) screen = <ProjectScreen project={project} onNav={goNav} />;
  else if (route === "today") screen = <TodayScreen onProject={goProject} onNav={goNav} seedDump={todaySeed} onSeedConsumed={() => setTodaySeed("")} />;
  else if (route === "summary") screen = <TodaySummary onNav={goNav} />;
  else if (route === "conversation") screen = <ConversationScreen seed={convoSeed} onNav={goNav} />;
  else if (route === "help") screen = <HelpScreen onNav={goNav} onTalk={goTalk} />;
  else if (route === "ideas") screen = <IdeasScreen onIdea={goIdea} onNav={goNav} />;
  else if (route === "idea" && idea) screen = <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} onNav={goNav} onTalk={goTalk} />;
  else if (route === "lab") screen = <LabScreen onNav={goNav} />;
  else if (route === "search") screen = <SearchScreen onProject={goProject} onNav={goNav} initialQuery={searchSeed} />;
  else screen = <HomeScreen onCommand={onHomeCommand} onNav={goNav} />;

  return (
    <AppLock>
      {screen}
      {IS_DEMO && <DemoBadge />}
    </AppLock>
  );
}
