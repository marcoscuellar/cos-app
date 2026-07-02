import { useEffect, useState } from "react";
import { COS_DATA } from "./data";
import { HomeScreen } from "./screens/Home";
import { TodayScreen } from "./screens/Today";
import { TodaySummary } from "./screens/TodaySummary";
import { ConversationScreen } from "./screens/Conversation";
import { ProjectsScreen } from "./screens/Projects";
import { ProjectScreen } from "./screens/ProjectDetail";
import { IdeasScreen } from "./screens/Ideas";
import { IdeaDetail } from "./screens/IdeaDetail";
import { LabScreen } from "./screens/Lab";
import { AppLock } from "./components/AppLock";
import { DemoBadge } from "./components/DemoBadge";
import { SearchScreen } from "./screens/Search";
import { loadState, saveState } from "./storage";
import { loadProjects, saveProjects } from "./projectsApi";
import type { Project } from "./types";
import { IS_DEMO } from "./session";
import { Regroup } from "./overlays/Regroup";
import { detectIntent, type RegroupMode } from "./regroup";
import type { Energy } from "./screens/Home";

type Route = "home" | "today" | "summary" | "projects" | "project" | "ideas" | "idea" | "lab" | "search" | "conversation";

// Session-only Regroup state — how the rescue takeover was opened. Never stored.
interface RegroupState {
  mode?: RegroupMode | null;
  preValidated?: boolean;
  safety?: boolean;
  text?: string;
}

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [projects, setProjects] = useState<Project[]>(COS_DATA.projects);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [searchSeed, setSearchSeed] = useState("");
  const [todaySeed, setTodaySeed] = useState("");
  const [convoSeed, setConvoSeed] = useState("");
  const [regroup, setRegroup] = useState<RegroupState | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [restMode, setRestMode] = useState(false);
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

  // Load the editable project list (falls back to seed data when none saved yet).
  useEffect(() => {
    if (IS_DEMO) return;
    loadProjects().then((p) => { if (p && p.length) setProjects(p); });
  }, []);

  // Create-or-update a room, then persist the whole list.
  const saveProject = (proj: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === proj.id);
      let next: Project[];
      if (exists) {
        next = prev.map((p) => (p.id === proj.id ? proj : p));
      } else {
        let id = proj.id;
        let n = 2;
        while (prev.some((p) => p.id === id)) id = `${proj.id}-${n++}`;
        next = [...prev, { ...proj, id }];
      }
      saveProjects(next);
      return next;
    });
  };
  const deleteProject = (id: string) => {
    setProjects((prev) => { const next = prev.filter((p) => p.id !== id); saveProjects(next); return next; });
    if (projectId === id) { setProjectId(null); setRoute("projects"); }
  };
  const archiveProject = (id: string, archived: boolean) => {
    setProjects((prev) => { const next = prev.map((p) => (p.id === id ? { ...p, archived } : p)); saveProjects(next); return next; });
  };

  const goProject = (id: string) => { setProjectId(id); setRoute("project"); };
  const goIdea = (id: string) => { setIdeaId(id); setRoute("idea"); };
  const goNav = (r: string) => { if (r === "search") setSearchSeed(""); if (r === "today") setTodaySeed(""); setRoute(r as Route); };
  const goTalk = (text: string) => { setConvoSeed(text); setRoute("conversation"); };

  // ── Regroup: the app's one rescue flow ────────────────────────────────────
  const openRegroup = (opts: RegroupState = {}) => setRegroup(opts);

  // main's original distress wiring, kept as a fast fallback for phrasing the
  // keyword tiers miss (safety terms are checked first, and always win).
  const MAIN_DISTRESS =
    /adhd|kicking my ass|winning today|overwhelm|can'?t (start|focus)|too much|i'?m stuck|help me start|falling apart|drowning|paraly/i;

  // Every free-text entry (typed or dictated) is screened for distress BEFORE the
  // normal command router runs. This is the single convergence point for all
  // rescue entry points — the Home input bar, voice, and the "Help me start" chip.
  const handleUserInput = async (text: string) => {
    const local = detectIntent(text);
    if (local === "safety") return openRegroup({ safety: true, text });
    if (local === "distress" || MAIN_DISTRESS.test(text)) return openRegroup({ preValidated: true, text });
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
      /* offline — fall through to the normal router */
    }
    onHomeCommand(text);
  };

  // Front-door command router (non-distress). Names a room → jump in;
  // "create my day…" → the Calendar builder; everything else → Conversation.
  const onHomeCommand = (text: string) => {
    const t = text.trim().toLowerCase();
    const named = projects.find((p) => p.name.toLowerCase() === t || p.id.toLowerCase() === t);
    if (named) { goProject(named.id); return; }
    const nav = t.match(/^(?:take me to|open|go to|jump to|show me|navigate to)\s+(?:my\s+)?(.+?)(?:\s+project)?$/);
    if (nav) {
      const target = nav[1].trim();
      const hit = projects.find(
        (p) => p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase()) || p.id.toLowerCase() === target,
      );
      if (hit) { goProject(hit.id); return; }
    }
    const day = text.trim().match(/^(?:create|build|plan|make|generate)\s+(?:my\s+)?day\b[\s,:.\-–—]*(.*)$/i);
    if (day) { setTodaySeed(day[1].trim()); setRoute("today"); return; }
    setConvoSeed(text);
    setRoute("conversation");
  };

  // The Doorway energy answer is load-bearing: "It broke" hands straight to
  // Regroup at the re-entry move. PRACTICE: energy-matched activation.
  const onEnergy = (e: Energy) => {
    setEnergy(e);
    setRestMode(false);
    if (e === "broke") openRegroup({ mode: "broke" });
  };

  // Avoid a flash before persisted prefs resolve.
  if (!loaded) return <div style={{ height: "100vh", background: "#faf9f5" }} />;

  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  const idea = ideaId ? D.ideas.find((i) => i.id === ideaId) : null;

  // Every screen is a full-viewport redesigned takeover with its own rail.
  let screen;
  if (route === "projects") screen = <ProjectsScreen projects={projects} onProject={goProject} onNav={goNav} onSave={saveProject} onDelete={deleteProject} onArchive={archiveProject} />;
  else if (route === "project" && project) screen = <ProjectScreen project={project} onNav={goNav} onSave={saveProject} onDelete={deleteProject} onArchive={archiveProject} />;
  else if (route === "today") screen = <TodayScreen onProject={goProject} onNav={goNav} seedDump={todaySeed} onSeedConsumed={() => setTodaySeed("")} />;
  else if (route === "summary") screen = <TodaySummary onNav={goNav} />;
  else if (route === "conversation") screen = <ConversationScreen seed={convoSeed} onNav={goNav} />;
  else if (route === "ideas") screen = <IdeasScreen onIdea={goIdea} onNav={goNav} />;
  else if (route === "idea" && idea) screen = <IdeaDetail idea={idea} onProject={goProject} onBack={() => goNav("ideas")} onNav={goNav} onTalk={goTalk} />;
  else if (route === "lab") screen = <LabScreen onNav={goNav} />;
  else if (route === "search") screen = <SearchScreen onProject={goProject} onNav={goNav} initialQuery={searchSeed} />;
  else screen = (
    <HomeScreen
      onCommand={handleUserInput}
      onNav={goNav}
      projects={projects}
      onProject={goProject}
      energy={energy}
      onEnergy={onEnergy}
      restMode={restMode}
      onRegroup={(m) => openRegroup({ mode: m })}
    />
  );

  return (
    <AppLock>
      {screen}
      {IS_DEMO && <DemoBadge />}

      {/* Persistent "Stuck?" pill — gold, bottom-right, on every screen. One of the
          three converging entry points into the single Regroup rescue flow. Never
          a badge, never a count: a rescue must not keep score. */}
      {!regroup && (
        <button className="stuck-pill" onClick={() => openRegroup({})} title="Regroup">
          <span className="sp-dot" />Stuck?
        </button>
      )}
      {regroup && (
        <Regroup
          onClose={() => setRegroup(null)}
          projects={projects}
          initialMode={regroup.mode ?? null}
          preValidated={regroup.preValidated}
          safety={regroup.safety}
          triggerText={regroup.text}
          onStepIn={goProject}
          onTalk={goTalk}
          onRested={() => setRestMode(true)}
        />
      )}
    </AppLock>
  );
}
