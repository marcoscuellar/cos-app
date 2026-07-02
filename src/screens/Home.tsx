import { useState } from "react";
import { COS_DATA } from "../data";
import { Icon } from "../components/Icon";
import { usePlan, type Energy } from "../plan";
import { useDictation } from "../dictation";
import { COPY, type RegroupMode } from "../regroup";

// ─────────────────────────────────────────────────────────────────────────────
// HOME — the "Companion Front Page".
//
//  Beat 1 · The Doorway (green)  — an energy check-in shown when energy is unknown.
//  Beat 2 · The Front Page (cream) — the working home after check-in.
//
// The energy answer is LOAD-BEARING: it shrinks the plan (low tank), keeps it
// whole (moving), or hands off to Regroup (it broke).
// PRACTICE: energy-matched activation; time + load externalization.
// ─────────────────────────────────────────────────────────────────────────────

interface HomeProps {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  /** Open the Regroup rescue flow (optionally straight to a matched move). */
  onRegroup: (mode?: RegroupMode) => void;
  /** Route free-text (rant/ask) through distress detection. */
  onInput: (text: string) => void;
}

// "Thursday, July 2" — the small masthead date (home timezone).
function frontDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

const ENERGY_LABEL: Record<Energy, string> = {
  moving: "Moving",
  low: "Low tank",
  broke: "It broke",
};

export function HomeScreen({ onProject, onNav, onRegroup, onInput }: HomeProps) {
  const { energy, plan, setEnergy, reopenCheckin, restMode, movedCount, clearRest } = usePlan();
  const name = COS_DATA.user.greetingName;

  // Doorway shown on first open / when energy is unknown.
  if (energy === null) {
    return <Doorway name={name} onEnergy={setEnergy} onRegroup={onRegroup} onNav={onNav} onInput={onInput} />;
  }

  return (
    <div className="frontpage">
      <div className="fp-wrap">
        {/* 1 — Masthead (small). Content starts immediately after. */}
        <div className="fp-masthead">
          <div className="fp-mast-l">
            <span className="fp-mast-logo">Ōllin</span>
            <span className="fp-mast-date">{frontDate()}</span>
          </div>
          <button className="fp-energy-badge" onClick={reopenCheckin} title="Re-answer">
            <span className="eb-dot" />{ENERGY_LABEL[energy]}
          </button>
        </div>

        {restMode ? (
          // "Rest. Ollin's got it" — today's pressure UI cleared until tomorrow.
          // PRACTICE: pacing / energy-based activation over push-through.
          <div className="fp-section">
            <div className="fp-rest">
              <div className="fr-line">{COPY.tired}</div>
              <div className="fr-sub">Your plan, your rooms, every thread — all held exactly as they are. Come back when the tank's back up.</div>
              <button className="fr-undo" onClick={clearRest}>Actually, show me today</button>
            </div>
          </div>
        ) : (
          <>
            {/* 2 — THE ONE THING. Biggest element. Serif. One gold Start pill. */}
            <div className="fp-section fp-onething">
              {plan.oneThing.roomName && (
                <div className="fp-ot-room" style={{ ["--ac" as string]: `var(--a-${plan.oneThing.accent})` }}>
                  <span className="otd" />{plan.oneThing.roomName}
                </div>
              )}
              <h1 className="fp-ot-title">
                {plan.oneThing.micro && <span className="micro-flag">Just this — nothing after it</span>}
                {plan.oneThing.title}
              </h1>
              <button
                className="fp-start"
                onClick={() => (plan.oneThing.roomId ? onProject(plan.oneThing.roomId) : onNav("today"))}
              >
                Start <Icon.arrow />
              </button>
            </div>

            {/* 3 — THE THREAD. Rooms as one-liners; tap = room. */}
            {plan.thread.length > 0 && (
              <div className="fp-section">
                <div className="fp-eyebrow">The thread</div>
                {plan.thread.map((r) => (
                  <button
                    key={r.id}
                    className="fp-thread-row"
                    style={{ ["--ac" as string]: `var(--a-${r.accent})` }}
                    onClick={() => onProject(r.id)}
                  >
                    <span className="tr-name"><span className="trd" />{r.name}</span>
                    <span className="tr-pick">pick up: <b>{r.pick}</b></span>
                    <span className="tr-when">{r.when}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 4 — TODAY, LIGHTLY. Max 3 + the promoted "make it lighter" link. */}
            <div className="fp-section">
              <div className="fp-today-head">
                <div className="fp-eyebrow" style={{ marginBottom: 0 }}>Today, lightly</div>
                {/* PRACTICE: cognitive-load capping — one tap collapses the day. */}
                <button className="fp-lighter" onClick={() => onRegroup("toomuch")}>
                  Too much? Make it lighter
                </button>
              </div>
              {plan.todos.map((t) => (
                <div key={t.id} className="fp-todo">
                  <span className="td-mark" />
                  <span>{t.title}</span>
                  {t.roomName && <span className="td-room">{t.roomName}</span>}
                </div>
              ))}
              {movedCount > 0 && <div className="fp-buffer">{COPY.tooMuch} — {movedCount} waiting for tomorrow.</div>}
              {plan.buffer && movedCount === 0 && (
                <div className="fp-buffer">Low tank — kept it short, with room to breathe.</div>
              )}
            </div>

            {/* 5 — ONE SPARK. A single, tiny rotating idea. */}
            {plan.spark && (
              <div className="fp-section">
                <button className="fp-spark" onClick={() => onNav("ideas")}>
                  <span className="fs-dot" /><span className="fs-label">Spark</span>{plan.spark}
                </button>
              </div>
            )}

            <div className="fp-voice">Small is still forward.</div>
          </>
        )}
      </div>

      {/* persistent input bar — rant, ask, or think out loud */}
      <FrontPageInput onInput={onInput} />
    </div>
  );
}

// ── Beat 1 — the Doorway (green) ─────────────────────────────────────────────
function Doorway({
  name,
  onEnergy,
  onRegroup,
  onNav,
  onInput,
}: {
  name: string;
  onEnergy: (e: Energy) => void;
  onRegroup: (mode?: RegroupMode) => void;
  onNav: (route: string) => void;
  onInput: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const dictation = useDictation((t) => onInput(t));

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    onInput(v);
  };

  const answer = (e: Energy) => {
    onEnergy(e);
    // "It broke" hands straight to Regroup at Beat 3/broke.
    // PRACTICE: context reinstatement — drop them back where the thread snapped.
    if (e === "broke") onRegroup("broke");
  };

  // Existing chips stay under the input.
  const chips: { label: string; run: () => void }[] = [
    { label: "Plan my day", run: () => onNav("today") },
    { label: "My projects", run: () => onNav("projects") },
    { label: "Unload an idea", run: () => onNav("ideas") },
    { label: "Remind me", run: () => onNav("today") },
    { label: "Help me start", run: () => onRegroup("cantstart") },
  ];

  return (
    <div className="ollin-doorway">
      <div className="od-inner">
        <div className="od-mark">
          <span className="od-logo">Ōllin</span>
          <span className="od-stamp">{frontDate()}</span>
        </div>

        <h1 className="od-greeting">Hey, {name}.</h1>
        <div className="od-ask">{COPY.doorwayAsk}</div>

        <div className="od-answers">
          <button className="od-answer" onClick={() => answer("moving")}>
            <span className="oa-t">Moving</span>
            <span className="oa-s">Tank's good. Let's go.</span>
          </button>
          <button className="od-answer" onClick={() => answer("low")}>
            <span className="oa-t">Low tank</span>
            <span className="oa-s">Here, but running light.</span>
          </button>
          <button className="od-answer" onClick={() => answer("broke")}>
            <span className="oa-t">It broke</span>
            <span className="oa-s">Lost the thread.</span>
          </button>
        </div>

        <div className="od-chatwrap">
          <div className="od-chatbar">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Rant, ask, or just think out loud…"
            />
            {dictation.supported && (
              <button
                className="oc-btn"
                onClick={dictation.toggle}
                title="Voice"
                style={dictation.listening ? { background: "rgba(217,164,65,.25)" } : undefined}
              >
                <Icon.mic />
              </button>
            )}
            <button className="oc-btn" onClick={submit} title="Send"><Icon.send /></button>
          </div>
          <div className="od-chips">
            {chips.map((c) => (
              <button key={c.label} className="od-chip" onClick={c.run}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── The persistent Front Page input ──────────────────────────────────────────
function FrontPageInput({ onInput }: { onInput: (text: string) => void }) {
  const [text, setText] = useState("");
  const dictation = useDictation((t) => onInput(t));

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    onInput(v);
  };

  return (
    <div className="fp-inputbar">
      <div className="fp-inputbar-inner">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Rant, ask, or just think out loud…"
        />
        {dictation.supported && (
          <button
            className="fi-btn"
            onClick={dictation.toggle}
            title="Voice"
            style={dictation.listening ? { background: "var(--ollin-gold-bg)" } : undefined}
          >
            <Icon.mic />
          </button>
        )}
        <button className="fi-btn" onClick={submit} title="Send"><Icon.send /></button>
      </div>
    </div>
  );
}
