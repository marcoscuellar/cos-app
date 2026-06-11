import { useEffect, useState } from "react";
import { COS_DATA } from "../data";
import { Icon } from "../components/Icon";
import type { DayPlan, PlannedBlock } from "../types";
import { loadPlan, buildPlan, updateIntention, saveBlocks } from "../dayPlanApi";

// Make sure every block has a stable id (older saved plans predate ids).
const ensureIds = (p: DayPlan): DayPlan => ({
  ...p,
  blocks: p.blocks.map((b, i) => (b.id ? b : { ...b, id: `b${i}_${Math.random().toString(36).slice(2, 6)}` })),
});

type AnyBlock = { id?: string; start: string; end: string; title: string; kind: string; proj: string | null; walkIn?: string; who?: string; done?: boolean };

// Default day shape — a long, gentle day with breathing room (severe-ADHD friendly).
const DEFAULT_HOURS = "7:00 AM – 10:00 PM";
const DEFAULT_PACING = "breathing-room";

// Quick links to the tools you live in — open in a new tab. icon = lucide line-art slug.
const LINKS: { label: string; url: string; icon: string }[] = [
  { label: "LinkedIn", url: "https://www.linkedin.com/feed/", icon: "briefcase" },
  { label: "Sales Nav", url: "https://www.linkedin.com/sales/home", icon: "target" },
  { label: "Gmail", url: "https://mail.google.com", icon: "mail" },
  { label: "Claude", url: "https://claude.ai", icon: "sparkles" },
  { label: "ChatGPT", url: "https://chatgpt.com", icon: "message-circle" },
  { label: "Gemini", url: "https://gemini.google.com/app", icon: "gem" },
  { label: "Grok", url: "https://grok.com", icon: "bot" },
  { label: "Discord", url: "https://discord.com/app", icon: "messages-square" },
];

/* TODAY — black-box branding + a Home-style brain-dump bar right underneath. */
export function TodayScreen({ onProject }: { onProject: (id: string) => void }) {
  const D = COS_DATA;
  const T = D.today;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);

  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [dump, setDump] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIntent, setEditingIntent] = useState(false);
  const [intentDraft, setIntentDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlannedBlock | null>(null);

  useEffect(() => {
    loadPlan().then((p) => {
      if (p) setPlan(ensureIds(p));
    });
  }, []);

  const blocks: AnyBlock[] = plan ? plan.blocks : (T.blocks as AnyBlock[]);

  // Live date in the user's home timezone, so the black box is always correct.
  const TZ = "America/Chicago";
  const now = new Date();
  const weekday = new Intl.DateTimeFormat(undefined, { timeZone: TZ, weekday: "long" }).format(now);
  const monthDay = new Intl.DateTimeFormat(undefined, { timeZone: TZ, month: "long", day: "numeric", year: "numeric" }).format(now);
  // The "done" celebration fires when you've actually checked everything off —
  // not just because the clock ran past the last block.
  const allDone = !!plan && plan.blocks.length > 0 && plan.blocks.every((b) => b.done);

  const submit = async () => {
    const text = dump.trim();
    if (!text || building) return;
    setBuilding(true);
    setError(null);
    const rooms = D.projects.map((p) => ({ id: p.id, name: p.name }));
    const { plan: next, error: err } = await buildPlan({ dump: text, rooms, hours: DEFAULT_HOURS, pacing: DEFAULT_PACING });
    setBuilding(false);
    if (next) {
      setPlan(ensureIds(next));
      setDump(""); // leave the box clean for the next dump
    } else setError(err || "Couldn't build your day — try again.");
  };

  // ── Block editing — the day has to flex (2pm meeting pushed to 5pm, etc.) ──
  const persist = (blocks: PlannedBlock[]) => {
    if (!plan) return;
    setPlan({ ...plan, blocks }); // optimistic — feels instant
    saveBlocks(blocks); // then durably save (cross-device)
  };
  const toggleDone = (b: PlannedBlock) =>
    persist((plan?.blocks ?? []).map((x) => (x.id === b.id ? { ...x, done: !x.done } : x)));
  const startEdit = (b: PlannedBlock) => {
    setEditId(b.id ?? null);
    setDraft({ ...b });
  };
  const saveEdit = () => {
    if (!draft || !plan) return;
    persist(plan.blocks.map((x) => (x.id === editId ? draft : x)));
    setEditId(null);
    setDraft(null);
  };
  const deleteBlock = (id?: string) => {
    if (!plan) return;
    persist(plan.blocks.filter((x) => x.id !== id));
    setEditId(null);
    setDraft(null);
  };
  const addBlock = () => {
    if (!plan) return;
    const nb: PlannedBlock = {
      id: `b_${Date.now().toString(36)}`,
      start: "12:00 PM", end: "1:00 PM", title: "New block", kind: "focus", proj: null, done: false,
    };
    persist([...plan.blocks, nb]);
    startEdit(nb);
  };

  const startEditIntent = () => {
    setIntentDraft(plan?.intention ?? "");
    setEditingIntent(true);
  };
  const saveIntent = async () => {
    setEditingIntent(false);
    const t = intentDraft.trim();
    if (!plan || t === (plan.intention ?? "")) return;
    setPlan({ ...plan, intention: t || undefined }); // optimistic
    const updated = await updateIntention(t);
    if (updated) setPlan(updated);
  };

  return (
    <div className="wrap today-arch">
      <div className="stagger">
        {/* FOYER — same architectural header as Home */}
        <div className="foyer">
          <div className="foyer-mark">
            <span className="cos-logo">COS</span>
            <span className="mono-meta">CALENDAR</span>
          </div>
          <span className="mono-meta q">{monthDay}</span>
        </div>

        {/* THE BLACK BOX — peaceful calendar hero: the day + the intention, nothing more */}
        <div className="cal-hero">
          <div className="ch-body">
            <div className="ch-left">
              <div className="dw-rule" />
              <span className="chip">{plan ? "Planned" : "Today"}</span>
              <div className="ch-day">{weekday}.</div>
              <div className="ch-date">{monthDay}</div>
            </div>

            {/* TODAY'S INTENTION — to the right, mirroring the foyer's quote (keeps the box compact) */}
            {plan && (
              <div className="ch-intent">
                <div className="ci-lbl">Today's intention</div>
                {allDone ? (
                  <div className="ci-quote ci-done">Touch grass. 🌱</div>
                ) : editingIntent ? (
                  <input
                    className="ci-input"
                    value={intentDraft}
                    onChange={(e) => setIntentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveIntent();
                      if (e.key === "Escape") setEditingIntent(false);
                    }}
                    onBlur={saveIntent}
                    placeholder="What matters most today?"
                    autoFocus
                  />
                ) : (
                  <button className={"ci-quote" + (plan.intention ? "" : " empty")} onClick={startEditIntent} title="Tap to edit">
                    {plan.intention ? `“${plan.intention}”` : "Set today's intention…"}
                    <span className="ci-edit">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="ch-foot">
            <span className="ch-syncline">
              <span className="cdot" />
              {plan ? "If it doesn't make you laugh, smile, profit, or finish — Let it go!" : `Synced with ${T.calendar} · COS attaches context`}
            </span>
          </div>
        </div>

        {/* BRAIN-DUMP BAR — full width under the box */}
        <div className="chatbar dump-bar" style={{ padding: "18px 20px" }}>
          <input
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={plan ? "Re-dump or adjust your day…" : "Brain-dump your day — gym, deep work on GLVE, call finance, lunch…"}
            disabled={building}
          />
          <button className="mic" title="Voice (or use your keyboard mic)"><Icon.mic /></button>
          <button className="send" title={building ? "Building…" : "Build my day"} onClick={submit} disabled={!dump.trim() || building}>
            <Icon.send />
          </button>
        </div>
        {building && <div className="dump-status"><span className="spin" />Building your day — focused sprints, real breaks, overflow deferred…</div>}
        {error && <div className="notes-failed" style={{ marginBottom: 18 }}>{error}</div>}
        {!building && !error && <div className="dump-status muted">Messy is fine. COS plans gently and never crams. ↵ to build.</div>}

        {/* WARM NOTE from COS about the plan */}
        {plan?.note && <div className="plan-note"><Icon.spark style={{ width: 15, height: 15 }} />{plan.note}</div>}

        {/* the day + the sticky launchpad rail */}
        <div className="today-body">
          <div className="today-main">
        <div className="timeline">
          {blocks.map((b, idx) => {
            const p = b.proj ? projOf(b.proj) : null;
            const accent = p ? p.accent : "blue";
            const linked = !!p;
            const editable = !!plan;
            const editing = editable && b.id != null && b.id === editId;
            return (
              <div key={b.id ?? idx} className={"tblock ac-" + accent + (b.done ? " done" : "")}>
                <div className="ttime">
                  <span className="ts">{b.start}</span>
                  <span className="te">{b.end}</span>
                </div>
                <div className="tspine"><span className="tnode" /></div>

                {editing && draft ? (
                  <div className="tcard tedit">
                    <div className="te-times">
                      <input className="te-time" value={draft.start} placeholder="9:00 AM"
                        onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                      <span className="te-dash">–</span>
                      <input className="te-time" value={draft.end} placeholder="10:00 AM"
                        onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                    </div>
                    <input className="te-title" value={draft.title} placeholder="What is it?"
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                    <select className="te-room" value={draft.proj ?? ""}
                      onChange={(e) => setDraft({ ...draft, proj: e.target.value || null })}>
                      <option value="">No room</option>
                      {D.projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                    <div className="te-actions">
                      <button className="btn btn-solid" onClick={saveEdit}>Save</button>
                      <button className="btn btn-ghost" onClick={() => { setEditId(null); setDraft(null); }}>Cancel</button>
                      <button className="te-del" onClick={() => deleteBlock(b.id)}>Delete</button>
                    </div>
                  </div>
                ) : (
                  <div className={"tcard" + (linked ? "" : " nolink")}>
                    {editable && (
                      <button className={"tcheck" + (b.done ? " on" : "")} onClick={() => toggleDone(b)}
                        title={b.done ? "Done — tap to undo" : "Mark done"}>{b.done ? "✓" : ""}</button>
                    )}
                    <div className="tc-top">
                      <span className={"kind " + (b.kind === "meeting" ? "meeting" : b.kind === "focus" ? "focus" : "")}>{b.kind}</span>
                      {b.who && <span style={{ fontSize: 12.5, color: "var(--ink-4)", fontWeight: 500 }}>with {b.who}</span>}
                      {p && <span className="tproj"><span className="pd" />{p.name}</span>}
                    </div>
                    <div className="ttitle">{b.title}</div>
                    {b.walkIn && (
                      <div className="twalk">
                        <span className="wlabel">{linked ? "Walk in with" : "COS"}</span>
                        {b.walkIn}
                      </div>
                    )}
                    <div className="tc-foot">
                      {linked && p && <button className="tenter" onClick={() => onProject(p.id)}>Enter {p.name} <Icon.arrow /></button>}
                      {editable && <button className="tedit-btn" onClick={() => startEdit(b)}>Edit · reschedule</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {plan && (
            <button className="add-block" onClick={addBlock}>
              <Icon.spark style={{ width: 14, height: 14 }} /> Add a block
            </button>
          )}
        </div>

        {/* DEFERRED — what COS intentionally left off today */}
        {plan && plan.deferred.length > 0 && (
          <div className="card deferred-card">
            <div className="card-eyebrow">Left for another day — on purpose</div>
            <div className="deferred-list">
              {plan.deferred.map((d, i) => (
                <div key={i} className="deferred-row"><span className="dd" />{d}</div>
              ))}
            </div>
            <div className="dump-hint" style={{ marginTop: 12 }}>Not dropped — just not today. A day you can finish beats one you can't.</div>
          </div>
        )}

        {!plan && (
          <>
            <div className="spacer-m" />
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, letterSpacing: "-.01em" }}>Plan tomorrow before you leave.</div>
                <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 3 }}>Drag a project onto a free block and COS pre-loads its context for the morning.</div>
              </div>
              <button className="btn btn-ghost">Plan tomorrow <Icon.arrow /></button>
            </div>
          </>
        )}
          </div>{/* /today-main */}

          <aside className="today-rail">
            <div className="rail-head"><span className="chip">Launchpad</span></div>
            <div className="rail-links">
              {LINKS.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="rail-link">
                  <img className="ri-ic" src={`https://cdn.jsdelivr.net/npm/lucide-static/icons/${l.icon}.svg`} alt=""
                    loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <span className="ri-name">{l.label}</span>
                  <Icon.arrow className="ri-arrow" />
                </a>
              ))}
            </div>
          </aside>
        </div>{/* /today-body */}
      </div>
    </div>
  );
}
