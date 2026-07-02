import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "../data";
import { IS_DEMO, OWNER_KEY } from "../session";
import { useDictation } from "../dictation";
import { loadDay } from "../dayPlanApi";
import { daySeed } from "../brief";
import type { DayPlan, Project } from "../types";
import type { RegroupMode } from "../regroup";

// ─────────────────────────────────────────────────────────────────────────────
// COS Home — the sanctuary front door (redesign · page 01 · "VariantHero"),
// grafted with the Ollin "Companion Front Page":
//   • the greeting + gold Newsreader line stay the Doorway,
//   • the energy answer under it is now LOAD-BEARING (moving / low tank / broke),
//   • and when the user has a day, a compact Front Page appears beneath —
//     THE ONE THING · THE THREAD · TODAY, LIGHTLY · ONE SPARK — sourced from
//     their live per-user plan (loadDay) and rooms (projects).
// PRACTICE: energy-matched activation; time + load externalization.
// ─────────────────────────────────────────────────────────────────────────────

export type Energy = "moving" | "low" | "broke";

const THEME: "dark" | "light" = "dark"; // the "lights low" mood

const TZ = "America/Chicago";
const GREETS = ["What's up", "Yo", "What's shaking", "Hey"];
// The gold human line — rotates per load, warm and low-pressure by design.
const QUESTIONS = [
  "Where's your energy at?",
  "Where are you right now?",
  "What's on your mind?",
  "Where'd you leave off?",
  "What's pulling at you?",
  "What matters today?",
  "Where should we start?",
  "How's today treating you so far?",
  "What's the vibe right now?",
  "Where's your head at?",
  "You good? Or is it one of those days?",
  "Catch me up — where are we at?",
];

type Chip = { label: string; insert?: string; route?: string };
const CHIPS: Chip[] = [
  { label: "Plan my day", insert: "Plan my day — what should today look like?" },
  { label: "My projects", route: "projects" },
  { label: "Unload an idea", insert: "I've got an idea — let me unload my brain: " },
  { label: "Remind me…", insert: "Remind me to " },
  { label: "Help me start", insert: "ADHD is winning today — can you help me start?" },
];

const ENERGY: { key: Energy; label: string; sub: string }[] = [
  { key: "moving", label: "Moving", sub: "Tank's good." },
  { key: "low", label: "Low tank", sub: "Running light." },
  { key: "broke", label: "It broke", sub: "Lost the thread." },
];

const Arrow = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Mic = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);
const Chevron = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}
    strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
);

function clockLine(d: Date): string {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(d);
  const t = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d);
  return `${day} · ${t}`;
}

interface HomeProps {
  onCommand: (text: string) => void;
  onNav: (route: string) => void;
  projects: Project[];
  onProject: (id: string) => void;
  energy: Energy | null;
  onEnergy: (e: Energy) => void;
  restMode: boolean;
  onRegroup: (mode?: RegroupMode) => void;
}

export function HomeScreen({ onCommand, onNav, projects, onProject, energy, onEnergy, restMode, onRegroup }: HomeProps) {
  const name = COS_DATA.user.greetingName || "";
  const initial = (name || "Y").charAt(0).toUpperCase();
  const [greet] = useState(() => GREETS[Math.floor(Math.random() * GREETS.length)]);
  const [question] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const [now, setNow] = useState(() => new Date());
  const [val, setVal] = useState("");
  const [owner, setOwner] = useState(false);
  const [day, setDay] = useState<DayPlan | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dictation = useDictation((t) => onCommand(t));

  useEffect(() => {
    try { setOwner(localStorage.getItem(OWNER_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  // Load today's plan so the Front Page can surface THE ONE THING + to-dos.
  useEffect(() => {
    if (IS_DEMO) return;
    loadDay().then(({ plan }) => setDay(plan));
  }, []);

  const reentry = () => {
    if (IS_DEMO && owner) { window.location.href = "/app?me=1"; return; }
    onNav("home");
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);

  const submit = () => {
    const q = val.trim();
    if (!q) return;
    setVal("");
    onCommand(q);
  };

  const tapChip = (c: Chip) => {
    if (c.route) { onNav(c.route); return; }
    setVal(c.insert ?? "");
    inputRef.current?.focus();
  };

  // ── The Front Page, sourced from live data ────────────────────────────────
  const active = projects.filter((p) => !p.archived && p.status !== "dormant");
  const lead = active[0] || projects[0] || null;
  const liveTodos = (day?.todos || []).filter((t) => !t.done && !t.tomorrow);
  // Low tank auto-shrinks the visible load (fewer to-dos); moving keeps it fuller.
  const todoCap = energy === "low" ? 2 : 3;
  const essentialTodos = liveTodos.filter((t) => t.essential);
  const shownTodos = (essentialTodos.length ? essentialTodos : liveTodos).slice(0, todoCap);
  const oneThing =
    (day?.intention && day.intention.trim()) ||
    (essentialTodos[0] || liveTodos[0])?.text ||
    (lead && (lead.nextAction || lead.focus)) ||
    "";
  const thread = active.slice(0, 3);
  const spark = COS_DATA.sparks.length ? COS_DATA.sparks[daySeed() % COS_DATA.sparks.length] : "";
  const hasFrontPage = !IS_DEMO && !!(oneThing || thread.length);
  const showToday = hasFrontPage && !restMode;

  return (
    <div className={"cos-home " + (THEME === "light" ? "v-light" : "v-a") + (showToday || restMode ? " has-today" : "")}>
      <div className="cos-rail">
        <button className="cos-rail-mark" onClick={reentry}
          title={IS_DEMO && owner ? "Back to your workspace" : "Home"}>Ōllin</button>
        <div className="cos-rail-av">{initial}</div>
      </div>

      <div className="h-clock"><span className="a-dot" /> {clockLine(now)}</div>

      <div className="h-stage">
        <h1 className="h-greet">{IS_DEMO ? "Hey friend." : <>{greet},<br />{name}.</>}</h1>
        <div className="h-q"><span className="serif-q">{question}</span></div>

        {/* The energy answer — load-bearing. PRACTICE: energy-matched activation. */}
        <div className="h-energy">
          {ENERGY.map((e) => (
            <button
              key={e.key}
              className={"energy-pill" + (energy === e.key ? " on" : "")}
              onClick={() => onEnergy(e.key)}
            >
              <span className="ep-t">{e.label}</span>
              <span className="ep-s">{e.sub}</span>
            </button>
          ))}
        </div>

        <div className="h-input-wrap">
          <div className="cos-input">
            <button className="cos-mic" aria-label="Voice"
              onClick={dictation.supported ? dictation.toggle : undefined}
              style={dictation.listening ? { color: "var(--ac)" } : undefined}><Mic /></button>
            <input
              ref={inputRef}
              className="cos-field"
              value={val}
              placeholder="Rant, ask, or just think out loud…"
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            <button className="cos-send" aria-label="Send" onClick={submit}><Arrow /></button>
          </div>
        </div>

        <div className="h-pills h-suggest">
          {CHIPS.map((c) => (
            <button key={c.label} className="cos-pill" onClick={() => tapChip(c)}>
              <span className="cos-pill-ch"><Chevron /></span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* ── Beat 2 — the Front Page, when there's a day to show ── */}
        {restMode && (
          // "Rest. Ollin's got it." — today's pressure UI cleared until tomorrow.
          <div className="h-today h-rest">
            <div className="ht-rest-line">Low tank is real. Ollin's holding everything; nothing expires.</div>
            <button className="ht-lighter" onClick={() => onEnergy("moving")}>Actually, show me today</button>
          </div>
        )}

        {showToday && (
          <div className="h-today">
            {oneThing && (
              <div className="ht-onething">
                <div className="ht-eyebrow">The one thing{lead ? ` · ${lead.name}` : ""}</div>
                <div className="ht-onething-line">{oneThing}</div>
                <button className="ht-start" onClick={() => (lead ? onProject(lead.id) : onNav("today"))}>
                  Start <Arrow />
                </button>
              </div>
            )}

            {thread.length > 0 && (
              <div className="ht-block">
                <div className="ht-eyebrow">The thread</div>
                {thread.map((p) => (
                  <button key={p.id} className="ht-thread" onClick={() => onProject(p.id)}>
                    <span className="ht-thread-name">{p.name}</span>
                    <span className="ht-thread-pick">pick up: {p.resume?.[0]?.t || p.focus || p.nextAction}</span>
                    <span className="ht-thread-when">{p.away}</span>
                  </button>
                ))}
              </div>
            )}

            {shownTodos.length > 0 && (
              <div className="ht-block">
                <div className="ht-today-head">
                  <div className="ht-eyebrow">Today, lightly</div>
                  {/* PRACTICE: cognitive-load capping — one tap collapses the day. */}
                  <button className="ht-lighter" onClick={() => onRegroup("toomuch")}>Too much? Make it lighter</button>
                </div>
                {shownTodos.map((t) => (
                  <div key={t.id} className="ht-todo"><span className="ht-todo-mark" />{t.text}</div>
                ))}
                {energy === "low" && liveTodos.length > shownTodos.length && (
                  <div className="ht-buffer">Low tank — kept it short, with room to breathe.</div>
                )}
              </div>
            )}

            {spark && (
              <button className="ht-spark" onClick={() => onNav("ideas")}>
                <span className="ht-spark-dot" /><span className="ht-spark-label">Spark</span>{spark}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
