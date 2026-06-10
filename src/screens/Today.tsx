import { useEffect, useState } from "react";
import { COS_DATA } from "../data";
import { Icon } from "../components/Icon";
import type { DayPlan } from "../types";
import { loadPlan, buildPlan, clearPlan } from "../dayPlanApi";

type AnyBlock = { start: string; end: string; title: string; kind: string; proj: string | null; walkIn?: string; who?: string };

// Default day shape — a long, gentle day with breathing room (severe-ADHD friendly).
const DEFAULT_HOURS = "7:00 AM – 10:00 PM";
const DEFAULT_PACING = "breathing-room";

/* TODAY — the calendar / day layer, with black-box branding + brain-dump planner. */
export function TodayScreen({ onProject }: { onProject: (id: string) => void }) {
  const D = COS_DATA;
  const T = D.today;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);

  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [dump, setDump] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan().then((p) => {
      if (p) setPlan(p);
    });
  }, []);

  const blocks: AnyBlock[] = plan ? plan.blocks : (T.blocks as AnyBlock[]);
  const tied = blocks.filter((b) => b.proj).length;

  // Live date in the user's home timezone, so the black box is always correct.
  const TZ = "America/Chicago";
  const now = new Date();
  const weekday = new Intl.DateTimeFormat(undefined, { timeZone: TZ, weekday: "long" }).format(now);
  const monthDay = new Intl.DateTimeFormat(undefined, { timeZone: TZ, month: "long", day: "numeric", year: "numeric" }).format(now);

  const submit = async () => {
    const text = dump.trim();
    if (!text || building) return;
    setBuilding(true);
    setError(null);
    const rooms = D.projects.map((p) => ({ id: p.id, name: p.name }));
    const { plan: next, error: err } = await buildPlan({ dump: text, rooms, hours: DEFAULT_HOURS, pacing: DEFAULT_PACING });
    setBuilding(false);
    if (next) {
      setPlan(next);
      setComposeOpen(false);
      setDump("");
    } else {
      setError(err || "Couldn't build your day — try again.");
    }
  };

  const startOver = async () => {
    setPlan(null);
    setDump(plan?.dump ?? "");
    setComposeOpen(true);
    await clearPlan();
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

        {/* THE BLACK BOX — the branded calendar hero */}
        <div className="cal-hero">
          <div className="ch-body">
            <div className="ch-left">
              <div className="dw-rule" />
              <span className="chip">{plan ? "Planned" : "Today"}</span>
              <div className="ch-day">{weekday}.</div>
              <div className="ch-date">{monthDay}</div>
            </div>
            <div className="ch-right">
              <div className="ch-stat">
                <span className="ch-num">{blocks.length}</span>
                <span className="ch-lbl">Blocks</span>
              </div>
              <div className="ch-stat">
                <span className="ch-num">{tied}</span>
                <span className="ch-lbl">Tied to a room</span>
              </div>
            </div>
          </div>
          <div className="ch-foot">
            <span className="ch-syncline">
              <span className="cdot" />
              {plan ? "Built by COS from your brain-dump" : `Synced with ${T.calendar} · COS attaches context`}
            </span>
            {plan ? (
              <button className="ch-dump" onClick={startOver}>
                <Icon.spark /> Re-dump my day
              </button>
            ) : (
              <button className="ch-dump" onClick={() => setComposeOpen((v) => !v)}>
                <Icon.spark /> Brain-dump my day
              </button>
            )}
          </div>
        </div>

        {/* BRAIN-DUMP COMPOSER */}
        {composeOpen && !plan && (
          <div className="card dump-composer">
            <div className="card-eyebrow">Brain-dump your day — messy is the point</div>
            <textarea
              className="notes-input dump-input"
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
              placeholder={"Everything in your head — order doesn't matter:\ngym, deep work on GLVE, call finance before noon, lunch w/ Sam, errands, prep for Monday…"}
              rows={5}
              autoFocus
            />
            {error && <div className="notes-failed">{error}</div>}
            <div className="dump-actions">
              <button className="btn btn-ghost" onClick={() => setComposeOpen(false)} disabled={building}>Cancel</button>
              <button className="btn btn-solid" onClick={submit} disabled={!dump.trim() || building}>
                {building ? "Building your day…" : "Build my day"} <Icon.spark style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div className="dump-hint">COS plans gently — focused sprints, real breaks, and it defers overflow instead of cramming. ⌘↵ to build.</div>
          </div>
        )}

        {/* WARM NOTE from COS about the plan */}
        {plan?.note && <div className="plan-note"><Icon.spark style={{ width: 15, height: 15 }} />{plan.note}</div>}

        <div className="timeline">
          {blocks.map((b, idx) => {
            const p = b.proj ? projOf(b.proj) : null;
            const accent = p ? p.accent : "blue";
            const linked = !!p;
            return (
              <div key={idx} className={"tblock ac-" + accent}>
                <div className="ttime">
                  <span className="ts">{b.start}</span>
                  <span className="te">{b.end}</span>
                </div>
                <div className="tspine"><span className="tnode" /></div>
                <div className={"tcard" + (linked ? "" : " nolink")}
                  onClick={() => linked && p && onProject(p.id)}>
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
                  {linked && p && (
                    <div className="tenter">Enter {p.name} <Icon.arrow /></div>
                  )}
                </div>
              </div>
            );
          })}
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
      </div>
    </div>
  );
}
