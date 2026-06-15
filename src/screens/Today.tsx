import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "../data";
import { Scaffold, Header, Mic, ArrowR, headerDate } from "../components/CosScaffold";
import type { DayPlan } from "../types";
import { loadPlan, buildPlan } from "../dayPlanApi";

// ─────────────────────────────────────────────────────────────────────────────
// Calendar — the day planner (redesign · page 04). Only ever shows today.
// Brain-dump bar → /api/plan-day → vertical agenda + Launchpad. No left rail —
// a focused full-bleed view with its own top bar. Source: CalendarPage.
// ─────────────────────────────────────────────────────────────────────────────

const TZ = "America/Chicago";
const DEFAULT_HOURS = "7:00 AM – 10:00 PM";
const DEFAULT_PACING = "breathing-room";

const LP_ICONS: Record<string, string> = {
  briefcase: "M3 8.5h18v10.5H3zM8 8.5V6.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z",
  mail: "M3 6h18v12H3zM3.5 7l8.5 6 8.5-6",
  spark: "M12 3.2l2.1 6.5 6.5 2.1-6.5 2.1L12 20.5l-2.1-6.6L3.4 11.8l6.5-2.1z",
  bubble: "M4 5h16v10.5H9.5L4 19.5z",
  gem: "M6 3.5h12l3 5.5-9 11.5L3 9z",
  grok: "M6 6h12v12H6zM9.5 9.5l5 5M14.5 9.5l-5 5",
  discord: "M7.5 8.5c3-1.6 5.5-1.6 9 0M7.5 15.5c3 1.6 5.5 1.6 9 0M8.5 8.5l-1 7M16.5 8.5l1 7",
};
const LP_APPS: [string, string, string][] = [
  ["LinkedIn", "briefcase", "https://www.linkedin.com/feed/"],
  ["Sales Nav", "target", "https://www.linkedin.com/sales/home"],
  ["Gmail", "mail", "https://mail.google.com"],
  ["Claude", "spark", "https://claude.ai"],
  ["ChatGPT", "bubble", "https://chatgpt.com"],
  ["Gemini", "gem", "https://gemini.google.com/app"],
  ["Grok", "grok", "https://grok.com"],
  ["Discord", "discord", "https://discord.com/app"],
];

type Block = { id?: string; start: string; end: string; title: string; kind: string; proj: string | null; walkIn?: string; who?: string };

// Which block is happening right now (Chicago time)?
function currentIndex(blocks: Block[]): number {
  const now = new Date();
  const nm =
    Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(now)) * 60 +
    Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, minute: "2-digit" }).format(now));
  const toMin = (t: string) => {
    const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return null;
    let h = +m[1];
    const mn = m[2] ? +m[2] : 0;
    const ap = m[3]?.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + mn;
  };
  return blocks.findIndex((b) => {
    const s = toMin(b.start);
    const e = toMin(b.end);
    return s !== null && s <= nm && (e === null || nm < e);
  });
}

// Parse "8:00 AM" / "14:30" → {h, m} (24h). null if unparseable.
function parseHM(t: string): { h: number; m: number } | null {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = +m[1];
  const mn = m[2] ? +m[2] : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return { h, m: mn };
}
const pad2 = (n: number) => String(n).padStart(2, "0");
const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// Build a standards-compliant .ics (Apple Calendar + Google Calendar both import this).
// Floating local times — events land at their wall-clock hour in whatever calendar opens them.
function buildIcs(blocks: Block[], y: string, mo: string, d: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//COS//Day Plan//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  blocks.forEach((b, i) => {
    const s = parseHM(b.start);
    if (!s) return;
    const e = parseHM(b.end) ?? { h: Math.floor((s.h * 60 + s.m + 30) / 60) % 24, m: (s.m + 30) % 60 };
    const at = (hm: { h: number; m: number }) => `${y}${mo}${d}T${pad2(hm.h)}${pad2(hm.m)}00`;
    const desc = [b.walkIn ? `Walk in with: ${b.walkIn}` : "", b.who ? `With ${b.who}` : "", "Planned by COS"].filter(Boolean).join(" · ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:cos-${y}${mo}${d}-${i}@costhread.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${at(s)}`,
      `DTEND:${at(e)}`,
      `SUMMARY:${icsEsc(b.title)}`,
      `DESCRIPTION:${icsEsc(desc)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

interface Props {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  seedDump?: string;
  onSeedConsumed?: () => void;
}

export function TodayScreen({ onProject, onNav, seedDump, onSeedConsumed }: Props) {
  const D = COS_DATA;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [dump, setDump] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPlan().then((p) => { if (p) setPlan(p); }); }, []);

  const runBuild = async (text: string) => {
    const t = text.trim();
    if (!t || building) return;
    setBuilding(true);
    setError(null);
    const rooms = D.projects.map((p) => ({ id: p.id, name: p.name }));
    const { plan: next, error: err } = await buildPlan({ dump: t, rooms, hours: DEFAULT_HOURS, pacing: DEFAULT_PACING });
    setBuilding(false);
    if (next) { setPlan(next); setDump(""); }
    else setError(err || "Couldn't build your day — try again.");
  };
  const submit = () => runBuild(dump);

  // A dump handed over from Home ("plan my day…") builds on arrival, once.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    const s = seedDump?.trim();
    if (!s) return;
    seeded.current = true;
    onSeedConsumed?.();
    runBuild(s);
  }, [seedDump]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocks: Block[] = plan ? plan.blocks : (D.today.blocks as Block[]);
  const nowIdx = currentIndex(blocks);
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(now);

  // Download today's plan as an .ics file — drops straight into Apple/Google Calendar.
  const downloadDay = () => {
    if (!blocks.length) return;
    const [y, mo, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(now).split("-");
    const blob = new Blob([buildIcs(blocks, y, mo, d)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cos-${y}-${mo}-${d}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Scaffold active="cal" onNav={onNav} initial={(D.user.greetingName || "M")[0]}>
      <Header
        eyebrow="PLAN THE DAY"
        date={headerDate()}
        label="CALENDAR"
        title={`${weekday}.`}
        quote="Plan the day you can actually finish."
        author="COS"
        sub="SYNCED WITH WORK · GOOGLE CALENDAR · COS ATTACHES CONTEXT"
      />
      <div className="calbody">
        <div className="caldump">
          <div className="cos-input">
            <input
              ref={inputRef}
              className="cos-field"
              value={dump}
              disabled={building}
              placeholder="Brain-dump your day — gym, deep work on GLVE, call finance, lunch…"
              onChange={(e) => setDump(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            <button className="cos-mic" tabIndex={-1} aria-label="Voice"><Mic /></button>
            <button className="cos-send" onClick={submit} aria-label="Build my day"><ArrowR s={19} /></button>
          </div>
          <div className="caldump-foot">
            <p className="caldump-help">
              {building ? "Building your day — focused sprints, real breaks, overflow deferred…"
                : error ? error
                : "Messy is fine. COS plans gently and never crams. ↵ to build."}
            </p>
            <button className="cal-export" onClick={downloadDay} disabled={!blocks.length} title="Download .ics — opens in Apple or Google Calendar">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
              Add to calendar
            </button>
          </div>
        </div>

        <div className="cal2">
          <div className="tl">
            {blocks.map((b, i) => {
              const p = b.proj ? projOf(b.proj) : null;
              const tagk = b.kind === "meeting" ? "meeting" : b.kind === "ritual" ? "ritual" : "focus";
              return (
                <div className={"tl-card" + (i === nowIdx ? " is-now" : "")} key={b.id ?? i}>
                  <div className="tl-cardtop">
                    <span className="tl-time">
                      <span className="tl-start">{b.start}</span>
                      <span className="tl-end">– {b.end}</span>
                    </span>
                    {i === nowIdx && <span className="tl-now">NOW</span>}
                    <span className={"ttag ttag-" + tagk}>{b.kind.toUpperCase()}</span>
                    {b.who && <span className="tl-meta">with {b.who}</span>}
                    {p && <span className="tl-proj"><i className="bdot" style={{ background: "var(--gold-bright)" }} />{p.name}</span>}
                  </div>
                  <h3 className="tl-title">{b.title}</h3>
                  {b.walkIn && <p className="tl-walk"><span className="tl-walk-k">WALK IN WITH</span> {b.walkIn}</p>}
                  {p && <button className="tl-enter" onClick={() => onProject(p.id)}>Enter {p.name} <ArrowR s={15} /></button>}
                </div>
              );
            })}
          </div>

          <aside className="lp">
            <span className="lp-k">LAUNCHPAD</span>
            <div className="lp-grid">
              {LP_APPS.map(([name, ico, url]) => (
                <a className="lp-tile" key={name} href={url} target="_blank" rel="noopener noreferrer">
                  <span className="lp-ico">
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#faf9f5" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={LP_ICONS[ico]} /></svg>
                  </span>
                  <span className="lp-label">{name}</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </Scaffold>
  );
}
