import { useEffect, useRef, useState } from "react";
import { COS_DATA } from "../data";
import { Scaffold, Mic, ArrowR } from "../components/CosScaffold";
import type { DayPlan, Note, TodoItem } from "../types";
import { loadDay, buildPlan, patchPlan } from "../dayPlanApi";
import { IS_DEMO } from "../session";

// ─────────────────────────────────────────────────────────────────────────────
// My Day — the redesign. A unified command box (brain-dump → builds the day,
// then becomes add-a-task), a dark schedule cover with now/next/past, the
// "From yesterday" carry-over, To Do / Finished / Move to tomorrow / Notes, a
// "make it lighter" mode, and a notes journal. Voice in every field.
// (Launchpad is hidden for now — restorable from the prior version.)
// ─────────────────────────────────────────────────────────────────────────────

const TZ = "America/Chicago";
const DEFAULT_HOURS = "7:00 AM – 10:00 PM";
const DEFAULT_PACING = "breathing-room";

type Block = { id?: string; start: string; end: string; title: string; kind: string; proj: string | null; walkIn?: string };

// Parse "8:00 AM" / "14:30" → minutes since midnight. null if unparseable.
function toMin(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = +m[1];
  const mn = m[2] ? +m[2] : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + mn;
}
function nowMinutes(): number {
  const now = new Date();
  return (
    Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(now)) * 60 +
    Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, minute: "2-digit" }).format(now))
  );
}
const pad2 = (n: number) => String(n).padStart(2, "0");
const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// Standards-compliant .ics — drops straight into Apple/Google Calendar.
function buildIcs(blocks: Block[], y: string, mo: string, d: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//COS//Day Plan//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  blocks.forEach((b, i) => {
    const sm = toMin(b.start);
    if (sm === null) return;
    const em = toMin(b.end) ?? sm + 30;
    const at = (mins: number) => `${y}${mo}${d}T${pad2(Math.floor(mins / 60) % 24)}${pad2(mins % 60)}00`;
    const desc = [b.walkIn ? `Walk in with: ${b.walkIn}` : "", "Planned by COS"].filter(Boolean).join(" · ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:cos-${y}${mo}${d}-${i}@costhread.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${at(sm)}`,
      `DTEND:${at(em)}`,
      `SUMMARY:${icsEsc(b.title)}`,
      `DESCRIPTION:${icsEsc(desc)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// ── Voice dictation — Web Speech API, one helper for every field ──────────────
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecCtor = new () => SpeechRec;
function getSR(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ── Demo seed — a representative, read-only day (fictional workspace) ─────────
const DEMO_BLOCKS: Block[] = [
  { start: "9:00 AM", end: "9:30 AM", title: "Slow start & coffee", kind: "ritual", proj: null, walkIn: "No screens for the first ten minutes." },
  { start: "9:30 AM", end: "11:00 AM", title: "Deep work — Lantern onboarding flow", kind: "focus", proj: "lantern" },
  { start: "11:00 AM", end: "11:30 AM", title: "Step away — short walk", kind: "break", proj: null },
  { start: "11:30 AM", end: "12:15 PM", title: "Sync with the design team", kind: "meeting", proj: null },
  { start: "12:30 PM", end: "1:30 PM", title: "Lunch, properly away from the desk", kind: "meal", proj: null },
  { start: "2:00 PM", end: "3:30 PM", title: "Tidepool research synthesis", kind: "focus", proj: "tidepool" },
  { start: "4:00 PM", end: "5:00 PM", title: "Clear small tasks & inbox", kind: "admin", proj: null },
  { start: "5:30 PM", end: "6:45 PM", title: "Buffer — rest before dinner", kind: "break", proj: null, walkIn: "Nap, lie down, or just nothing. This is on the calendar on purpose." },
  { start: "7:00 PM", end: "10:00 PM", title: "Dinner with a friend", kind: "meeting", proj: null },
];
const DEMO_PLAN: DayPlan = {
  dump: "",
  blocks: DEMO_BLOCKS,
  deferred: [],
  intention: "A full but breathable day — two real focus blocks, honest breaks, and you're protected before dinner.",
  note: "COS kept your evening light — you've got real downtime before dinner, so you arrive rested, not frazzled.",
  createdAt: Date.now(),
  todos: [
    { id: "d1", text: "Finish the Lantern onboarding flow", done: false, createdAt: 0, when: "Morning", hint: "Pick up where you left off — screen 4.", essential: true, steps: [{ text: "Open the file, reread screen 3", done: true }, { text: "Build screen 4 — empty states", done: false }, { text: "Skim once, then share with the team", done: false }] },
    { id: "d2", text: "Send the research summary to the team", done: false, createdAt: 0, when: "Afternoon", hint: "Two minutes once the synthesis is in." },
    { id: "d3", text: "Reply to design with the spacing decision", done: false, createdAt: 0, when: "Before 11:30", hint: "They just need a yes / no.", essential: true },
    { id: "d4", text: "Protect time to rest before dinner", done: false, createdAt: 0, when: "Evening", hint: "So you arrive rested, not running on empty.", essential: true, cos: "COS added · from your 7 PM dinner" },
    { id: "d5", text: "Grab a bottle of wine for dinner", done: false, createdAt: 0, cos: "COS added · linked to dinner tonight" },
    { id: "d0", text: "Take morning meds & water", done: true, createdAt: 0 },
  ],
  journal: [
    { id: "j1", text: "Coffee with Maya — she hinted the role might open up in Q3. Went well, but I overexplained the gap year again. Note to self: it's fine. Stop justifying it.", createdAt: Date.now() - 76_000_000 },
  ],
};
const DEMO_CARRY: TodoItem[] = [
  { id: "c1", text: "Book the dentist appointment", done: false, createdAt: 0 },
  { id: "c2", text: "Email the landlord about the lease renewal", done: false, createdAt: 0 },
  { id: "c3", text: "Pick up the prescription refill", done: false, createdAt: 0, essential: true },
  { id: "c4", text: "Text Sarah back", done: false, createdAt: 0, hint: "Quick one — she'll appreciate it." },
];

type Tab = "todo" | "done" | "tomorrow" | "notes";

interface Props {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  seedDump?: string;
  onSeedConsumed?: () => void;
}

export function TodayScreen({ onProject, onNav, seedDump, onSeedConsumed }: Props) {
  const D = COS_DATA;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);

  const [plan, setPlan] = useState<DayPlan | null>(IS_DEMO ? DEMO_PLAN : null);
  const [todos, setTodos] = useState<TodoItem[]>(IS_DEMO ? DEMO_PLAN.todos ?? [] : []);
  const [journal, setJournal] = useState<Note[]>(IS_DEMO ? DEMO_PLAN.journal ?? [] : []);
  const [carryover, setCarryover] = useState<TodoItem[]>(IS_DEMO ? DEMO_CARRY : []);
  const [carryMsg, setCarryMsg] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("todo");
  const [lighter, setLighter] = useState(false);
  const [cmd, setCmd] = useState("");
  const [building, setBuilding] = useState(false);
  const [justBuilt, setJustBuilt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [, force] = useState(0); // re-tick the schedule highlight each minute

  const cmdRef = useRef<HTMLInputElement>(null);

  const hydrate = (p: DayPlan) => { setTodos(p.todos ?? []); setJournal(p.journal ?? []); };
  useEffect(() => {
    if (IS_DEMO) return;
    loadDay().then(({ plan: p, carryover: c }) => {
      if (p) { setPlan(p); hydrate(p); }
      setCarryover(c);
    });
  }, []);

  // Keep the now/next highlight live.
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const planned = !!plan && plan.blocks.length > 0;
  const persistTodos = (next: TodoItem[]) => { setTodos(next); patchPlan({ todos: next }); };
  const persistJournal = (next: Note[]) => { setJournal(next); patchPlan({ journal: next }); };

  // ── to-do mutations ──────────────────────────────────────────────────────
  const toggleTodo = (id: string) => persistTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTodo = (id: string) => persistTodos(todos.filter((t) => t.id !== id));
  const moveTomorrow = (id: string, to: boolean) =>
    persistTodos(todos.map((t) => (t.id === id ? { ...t, tomorrow: to || undefined } : t)));
  const toggleStep = (id: string, idx: number) =>
    persistTodos(todos.map((t) => (t.id === id ? { ...t, steps: t.steps?.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)) } : t)));
  const addTodo = (text: string) => {
    const v = text.trim();
    if (!v) return;
    persistTodos([...todos, { id: newId("t"), text: v, done: false, createdAt: Date.now(), when: "Added" }]);
  };

  // ── carry-over ───────────────────────────────────────────────────────────
  const carryYes = () => {
    const carried = carryover.map((t) => ({ ...t, id: newId("t"), done: false, tomorrow: undefined, carried: true }));
    setTodos((prev) => {
      const next = [...prev, ...carried];
      patchPlan({ todos: next, carryDone: true });
      return next;
    });
    setCarryMsg(`Carried ${carryover.length} over into today.`);
  };
  const carryNo = () => {
    setCarryMsg("Tucked away — they'll wait for you, no guilt.");
    patchPlan({ carryDone: true });
  };
  const showCarry = carryover.length > 0 && carryMsg === null;

  // ── notes journal ────────────────────────────────────────────────────────
  const saveNote = () => {
    const v = noteDraft.trim();
    if (!v) return;
    persistJournal([{ id: newId("j"), text: v, createdAt: Date.now() }, ...journal]);
    setNoteDraft("");
  };

  // ── build / command box ──────────────────────────────────────────────────
  const runBuild = async (text: string) => {
    const t = text.trim();
    if (!t || building) return;
    setBuilding(true);
    setError(null);
    const rooms = D.projects.map((p) => ({ id: p.id, name: p.name }));
    const { plan: next, error: err } = await buildPlan({ dump: t, rooms, hours: DEFAULT_HOURS, pacing: DEFAULT_PACING });
    setBuilding(false);
    if (next) {
      setPlan(next);
      hydrate(next);
      setCmd("");
      setTab("todo");
      setJustBuilt(true);
      setTimeout(() => setJustBuilt(false), 650);
    } else setError(err || "Couldn't build your day — try again.");
  };
  const cmdSubmit = () => {
    if (!planned) runBuild(cmd);
    else { addTodo(cmd); setCmd(""); }
  };

  // A dump handed over from Home ("plan my day…") builds on arrival, once.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || IS_DEMO) return;
    const s = seedDump?.trim();
    if (!s) return;
    seeded.current = true;
    onSeedConsumed?.();
    runBuild(s);
  }, [seedDump]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── dictation ────────────────────────────────────────────────────────────
  const recRef = useRef<SpeechRec | null>(null);
  const [listening, setListening] = useState<null | "cmd" | "note">(null);
  const dictate = (which: "cmd" | "note") => {
    if (recRef.current) { recRef.current.stop(); return; }
    const SR = getSR();
    if (!SR) { (which === "cmd" ? cmdRef.current : null)?.focus(); return; }
    const base = which === "note" ? (noteDraft ? noteDraft.replace(/\s*$/, "") + " " : "") : "";
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = which === "note";
    recRef.current = r;
    setListening(which);
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (which === "cmd") setCmd(base + t);
      else setNoteDraft(base + t);
    };
    r.onerror = () => { recRef.current = null; setListening(null); };
    r.onend = () => { recRef.current = null; setListening(null); };
    r.start();
  };

  // ── schedule data ────────────────────────────────────────────────────────
  const blocks: Block[] = planned ? (plan!.blocks as Block[]) : [];
  const nm = nowMinutes();
  let nowIdx = -1;
  let nextIdx = -1;
  blocks.forEach((b, i) => {
    const sm = toMin(b.start);
    const em = toMin(b.end);
    if (sm !== null && em !== null && nm >= sm && nm < em && nowIdx < 0) nowIdx = i;
  });
  if (nowIdx < 0) {
    nextIdx = blocks.findIndex((b) => { const sm = toMin(b.start); return sm !== null && nm < sm; });
  }

  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(now);

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

  // ── derived lists ────────────────────────────────────────────────────────
  const openTodos = todos.filter((t) => !t.done && !t.tomorrow);
  const doneTodos = todos.filter((t) => t.done);
  const tomorrowTodos = todos.filter((t) => t.tomorrow && !t.done);
  const donePct = todos.filter((t) => !t.tomorrow).length
    ? Math.round((doneTodos.length / todos.filter((t) => !t.tomorrow).length) * 100)
    : 0;

  const rootCls =
    "md" +
    (building ? " is-building" : planned ? "" : " is-unplanned") +
    (lighter ? " is-lighter" : "") +
    (justBuilt ? " just-built" : "");

  // ── render a single to-do row ────────────────────────────────────────────
  const renderTodo = (t: TodoItem, where: "today" | "tomorrow") => (
    <li key={t.id} className={"tdy-todo" + (t.cos ? " tdy-cos" : "") + (t.carried ? " tdy-carry" : "") + (t.tomorrow ? " is-tomorrow" : "")} data-essential={t.essential ? "1" : "0"}>
      <button className="tdy-check" onClick={() => toggleTodo(t.id)} aria-label="Mark done" />
      <div className="tdy-todo-main">
        {t.when && <span className="tdy-when">{t.when}</span>}
        <span className="tdy-todo-txt">{t.text}</span>
        {t.hint && <span className="tdy-hint">{t.hint}</span>}
        {!!t.steps?.length && (
          <ul className="tdy-steps">
            {t.steps.map((s, i) => (
              <li key={i} className={"tdy-step" + (s.done ? " is-done" : "")}>
                <button className={"tdy-step-check" + (s.done ? " on" : "")} onClick={() => toggleStep(t.id, i)} aria-label="Step">{s.done ? "✓" : ""}</button>
                <span className="tdy-step-txt">{s.text}</span>
              </li>
            ))}
          </ul>
        )}
        {t.cos ? <span className="tdy-cos-tag"><span className="s" />{t.cos}</span>
          : t.carried ? <span className="tdy-carry-tag">↩ From yesterday</span> : null}
        {where === "tomorrow" && <span className="tdy-tom-tag">→ Tomorrow</span>}
      </div>
      {!IS_DEMO && (
        <div className="tdy-actions">
          {where === "today"
            ? <button className="tdy-todo-move" onClick={() => moveTomorrow(t.id, true)} aria-label="Move to tomorrow" title="Move to tomorrow">→</button>
            : <button className="tdy-todo-move" onClick={() => moveTomorrow(t.id, false)} aria-label="Bring back to today" title="Bring back to today">↩</button>}
          <button className="tdy-todo-x" onClick={() => removeTodo(t.id)} aria-label="Delete" title="Delete">×</button>
        </div>
      )}
    </li>
  );

  const fmtStamp = (ts: number) =>
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", hour: "numeric", minute: "2-digit" }).format(new Date(ts)).toUpperCase();

  return (
    <Scaffold active="cal" onNav={onNav} initial={(D.user.greetingName || "M")[0]}>
      <div className={rootCls}>
        <div className="room">
          {/* LEFT — dark schedule cover */}
          <aside className="room-cover">
            <div className="rc-top">
              <button className="rc-chip" onClick={() => onNav("home")}>COS</button>
              <div className="rc-top-r">
                <span className="rc-room"><i className="bdot" />{weekday} · Today</span>
                <span className="rc-cos">Context Operating System</span>
              </div>
            </div>
            <span className="rc-tick" />
            <span className="rc-eyebrow">Today's schedule</span>
            <h2 className="rc-title">TODAY</h2>
            {plan?.intention && <p className="rc-desc">{plan.intention}</p>}

            <p className="rc-empty">No plan yet — brain-dump on the right, or tap the mic and just talk. I'll build your day right here.</p>

            <div className="rc-building">
              <div className="rc-build-label"><span className="bdot" />Building your day…</div>
              {[90, 74, 82, 62, 78].map((w) => <div className="rc-build-row" key={w} style={{ width: w + "%" }} />)}
            </div>

            {planned && (
              <div className="tdy-sched">
                {blocks.map((b, i) => {
                  const p = b.proj ? projOf(b.proj) : null;
                  const state = i === nowIdx ? "is-now" : i === nextIdx ? "" : toMin(b.end) !== null && nm >= (toMin(b.end) as number) ? "is-past" : "";
                  const rest = b.kind === "break" || b.kind === "rest";
                  return (
                    <div className={"tdy-srow" + (state ? " " + state : "") + (rest ? " tdy-rest" : "")} key={b.id ?? i}>
                      <span className="tdy-time">{b.start}{b.end && <i>{b.end}</i>}</span>
                      <span className="tdy-stitle">
                        {b.title}
                        {p && <button className="tdy-proj" onClick={() => onProject(p.id)}>{p.name} →</button>}
                        {b.walkIn && <span className="tdy-sub">{b.walkIn}</span>}
                        {i === nowIdx && <em className="tdy-now">NOW</em>}
                        {i === nextIdx && <em className="tdy-now">NEXT</em>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {plan?.note && <p className="tdy-note">{plan.note}</p>}
            {planned && <div className="rc-btns"><button className="rc-tidy" onClick={downloadDay}>Add to calendar</button></div>}
          </aside>

          {/* RIGHT — command box, carry-over, tabs */}
          <section className="room-ctx">
            {showCarry ? (
              <div className="carry">
                <div className="carry-head">
                  <span className="carry-eyebrow">↩ From yesterday</span>
                  <span className="carry-meta">{carryover.length} still open</span>
                </div>
                <p className="carry-q">You left {carryover.length} {carryover.length === 1 ? "thing" : "things"} unfinished yesterday — still important, not failures. Bring them into today?</p>
                <ul className="carry-list">
                  {carryover.map((t) => <li key={t.id}>{t.text}</li>)}
                </ul>
                <div className="carry-actions">
                  <button className="carry-yes" onClick={carryYes}>Yes, carry them over</button>
                  <button className="carry-no" onClick={carryNo}>Not today</button>
                </div>
              </div>
            ) : carryMsg ? (
              <div className="carry"><div className="carry-done">{carryMsg.startsWith("Carried") && <span className="ck">✓</span>}{carryMsg}</div></div>
            ) : null}

            <div className="cmd-wrap">
              <div className="cos-input">
                <button className={"cos-mic" + (listening === "cmd" ? " listening" : "")} onClick={() => dictate("cmd")} aria-label="Talk to COS"><Mic /></button>
                <input
                  ref={cmdRef}
                  className="cos-field"
                  value={cmd}
                  disabled={building || IS_DEMO}
                  placeholder={planned ? "Add a task… or tell COS to adjust your day" : "Plan my day — gym, deep work on Lantern, call the team, dinner…"}
                  onChange={(e) => setCmd(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); cmdSubmit(); } }}
                />
                <button className="cos-send" onClick={cmdSubmit} aria-label={planned ? "Add task" : "Build my day"}>
                  {planned ? <span className="cos-plus">＋</span> : <ArrowR s={19} />}
                </button>
              </div>
              <p className="caldump-help cmd-help">
                {building ? "Building your day — focused sprints, real breaks, evening protected…"
                  : error ? error
                  : planned ? "Same box — now for quick adds. Tap the mic to talk, or type and press ↵."
                  : "Brain-dump everything — messy is fine. Tap the mic to talk. COS builds your schedule and pulls out the to-dos."}
              </p>
            </div>

            <div className="ctx-bar">
              <div className="ctx-tabs">
                <button className={"tab" + (tab === "todo" ? " is-on" : "")} onClick={() => setTab("todo")}>To&nbsp;Do <sup>{openTodos.length}</sup></button>
                <button className={"tab" + (tab === "done" ? " is-on" : "")} onClick={() => setTab("done")}>Finished <sup>{doneTodos.length}</sup></button>
                <button className={"tab" + (tab === "tomorrow" ? " is-on" : "")} onClick={() => setTab("tomorrow")}>Move&nbsp;to&nbsp;tomorrow <sup>{tomorrowTodos.length}</sup></button>
                <button className={"tab" + (tab === "notes" ? " is-on" : "")} onClick={() => setTab("notes")}>Notes</button>
              </div>
            </div>

            {/* TO DO */}
            <div className={"pane" + (tab === "todo" ? " is-on" : "")}>
              <div className="pane-top">
                <span className="pane-eyebrow">Today's to-dos</span>
                <button className={"lighter-link" + (lighter ? " on" : "")} onClick={() => setLighter((l) => !l)}>
                  {lighter ? "Show the full day" : "Too much? Make it lighter"}
                </button>
              </div>
              <div className="tdy-lighterline">Here's a lighter version of today — just the truest things. The rest is tucked away, guilt-free.</div>

              {openTodos.length ? (
                <ul className="tdy-list">{openTodos.map((t) => renderTodo(t, "today"))}</ul>
              ) : (
                <p className="todo-empty-static">
                  {planned ? "All clear for now. Add a task above, or check Move to tomorrow." : "Plan your day with the box above and I'll pull the to-dos out for you — including the ones you'd forget, like protecting time to rest before dinner. Or add your own, anytime."}
                </p>
              )}

              {planned && <p className="tdy-foot">COS reads your calendar and the shape of your day, then adds what you'd forget — including time to rest. Nothing here is a demand.</p>}
            </div>

            {/* FINISHED */}
            <div className={"pane" + (tab === "done" ? " is-on" : "")}>
              <div className="tdy-progress">
                <span className="tdy-progress-k">{doneTodos.length} of {todos.filter((t) => !t.tomorrow).length} done</span>
                <span className="tdy-bar"><i style={{ width: donePct + "%" }} /></span>
              </div>
              {doneTodos.length ? (
                <ul className="tdy-list">
                  {doneTodos.map((t) => (
                    <li key={t.id} className="tdy-todo is-done">
                      <button className="tdy-check on" onClick={() => toggleTodo(t.id)} aria-label="Restore">✓</button>
                      <div className="tdy-todo-main"><span className="tdy-todo-txt">{t.text}</span></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tdy-empty">Nothing finished yet — tap a task's circle when you're done.</p>
              )}
            </div>

            {/* MOVE TO TOMORROW */}
            <div className={"pane" + (tab === "tomorrow" ? " is-on" : "")}>
              <p className="pane-note">Pushed to tomorrow — no guilt. Whatever lands here becomes your “From yesterday” carry-over when you open COS in the morning.</p>
              {tomorrowTodos.length ? (
                <ul className="tdy-list">{tomorrowTodos.map((t) => renderTodo(t, "tomorrow"))}</ul>
              ) : (
                <p className="tdy-empty">Nothing pushed yet. On any to-do, tap the → to move it to tomorrow.</p>
              )}
            </div>

            {/* NOTES */}
            <div className={"pane" + (tab === "notes" ? " is-on" : "")}>
              <p className="pane-note">A place to brain-dump the day — how an interview went, a run-in with an old friend, a thought you want to keep. COS holds it so you don't have to.</p>
              {!IS_DEMO && (
                <div className="note-compose">
                  <div className="note-field">
                    <textarea className="note-input" value={noteDraft} placeholder="What's on your mind? Type, paste, or tap the mic to talk…" onChange={(e) => setNoteDraft(e.target.value)} />
                    <button className={"note-mic" + (listening === "note" ? " listening" : "")} onClick={() => dictate("note")} aria-label="Dictate note" title="Dictate"><Mic /></button>
                  </div>
                  <button className="note-save" onClick={saveNote}>Save note</button>
                </div>
              )}
              {journal.length ? (
                <ul className="note-list">
                  {journal.map((n) => (
                    <li key={n.id} className="note-card">
                      <div className="nt-time">{fmtStamp(n.createdAt)}</div>
                      <div className="nt-body">{n.text}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tdy-empty">No notes yet. Whatever's on your mind, drop it here.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </Scaffold>
  );
}
