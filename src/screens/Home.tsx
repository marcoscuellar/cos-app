import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "../data";
import { IS_DEMO } from "../session";

// ─────────────────────────────────────────────────────────────────────────────
// COS Home — the sanctuary front door (redesign · page 01 · "VariantHero").
//
// Full-viewport, vertically centered, no scroll. Two moods via a theme class:
// dark "lights low" (default) / light cream. A random casual greeting per load,
// ONE static gold Newsreader line (principle #5 — never rotating), a quiet
// command bar, and low-key suggestion chips. Source of truth: COS Home —
// Directions.html <style> + home-variants.jsx VariantHero.
// ─────────────────────────────────────────────────────────────────────────────

const THEME: "dark" | "light" = "dark"; // flip to "dark" for the "lights low" mood

const TZ = "America/Chicago";
const GREETS = ["What's up", "Yo", "What's shaking", "Hey"];
const QUESTION = "Where are you right now?"; // static — the one gold human line

type Chip = { label: string; insert?: string; route?: string };
const CHIPS: Chip[] = [
  { label: "Plan my day", insert: "Plan my day — what should today look like?" },
  { label: "Take me to my projects", route: "projects" },
  { label: "I've got an idea — let me unload it", insert: "I've got an idea — let me unload my brain: " },
  { label: "Remind me…", insert: "Remind me to " },
  { label: "ADHD's winning today — help", insert: "ADHD is winning today — can you help me start?" },
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
}

export function HomeScreen({ onCommand, onNav }: HomeProps) {
  const name = COS_DATA.user.greetingName || "";
  const initial = (name || "Y").charAt(0).toUpperCase();
  const [greet] = useState(() => GREETS[Math.floor(Math.random() * GREETS.length)]);
  const [now, setNow] = useState(() => new Date());
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Live clock — minute precision is enough, so a 20s tick keeps it honest.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);

  const submit = () => {
    const q = val.trim();
    if (!q) return;
    setVal("");
    onCommand(q); // routes (project / plan-my-day / search); → Conversation later
  };

  // Chips fill the input + focus, except nav chips which route instead.
  const tapChip = (c: Chip) => {
    if (c.route) { onNav(c.route); return; }
    setVal(c.insert ?? "");
    inputRef.current?.focus();
  };

  return (
    <div className={"cos-home " + (THEME === "light" ? "v-light" : "v-a")}>
      <div className="cos-rail">
        <div className="cos-rail-mark">COS</div>
        <div className="cos-rail-av">{initial}</div>
      </div>

      <div className="h-stage">
        <div className="h-eyebrow"><span className="a-dot" /> {clockLine(now)}</div>
        <h1 className="h-greet">{IS_DEMO ? "Hey you." : <>{greet},<br />{name}.</>}</h1>
        <div className="h-q"><span className="serif-q">{QUESTION}</span></div>

        <div className="h-input-wrap">
          <div className="cos-input">
            <button className="cos-mic" aria-label="Voice" tabIndex={-1}><Mic /></button>
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
            <button key={c.label} className="cos-pill cos-pill--quiet" onClick={() => tapChip(c)}>
              <span className="cos-pill-ch"><Chevron /></span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
