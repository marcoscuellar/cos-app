import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import type { Project } from "../types";
import { buildRegroupPlan } from "../regroupData";
import { loadDay, patchPlan } from "../dayPlanApi";
import {
  COPY,
  TRIAGE,
  computeMove,
  SAFETY_RESOURCES,
  type RegroupMode,
  type RegroupMove,
  type RegroupPlan,
} from "../regroup";

// ─────────────────────────────────────────────────────────────────────────────
// Regroup — the app's ONE rescue flow. A calm modal panel on green, one thing
// per beat. This is the evolution of the old Help "rescue room": the spec's flow
// (validate → triage → matched move → close), copy deck, safety valve, and
// no-history rule win; main's better bits are kept — distress detection wiring
// (App.onHomeCommand) and the conversation-spine handoff (onTalk) both converge
// here.
//
// Hard rules (spec §2.4), enforced structurally:
//   • No history, no counters, no logs — this component stores NOTHING about the
//     rescue itself. It reads the live plan, applies one move, and closes.
//   • Max ONE gold CTA visible per beat.
//   • Ollin voice: short, kind, zero clinical jargon on-screen.
// ─────────────────────────────────────────────────────────────────────────────

type Beat = "validate" | "triage" | "move" | "close";

interface RegroupProps {
  onClose: () => void;
  /** The signed-in user's live rooms (needed to compute matched moves). */
  projects: Project[];
  /** Jump straight to a matched move (e.g. "It broke" from the Doorway). */
  initialMode?: RegroupMode | null;
  /** Open pre-validated straight into triage (distress detected in the input). */
  preValidated?: boolean;
  /** Heavier-than-work language → serve the Safety Net, never a productivity move. */
  safety?: boolean;
  /** The text that triggered Regroup — sent to sharpen the move, never stored. */
  triggerText?: string;
  /** Navigate into a room (for "It broke" / re-entry). */
  onStepIn?: (roomId: string) => void;
  /** Hand off to the Conversation spine (main's Help→talk integration, preserved). */
  onTalk?: (text: string) => void;
  /** "Just tired" chose rest — clear today's pressure UI (session only). */
  onRested?: () => void;
}

export function Regroup({
  onClose,
  projects,
  initialMode,
  preValidated,
  safety,
  triggerText,
  onStepIn,
  onTalk,
  onRested,
}: RegroupProps) {
  const firstBeat: Beat = initialMode ? "move" : preValidated ? "triage" : "validate";
  const [beat, setBeat] = useState<Beat>(firstBeat);
  const [mode, setMode] = useState<RegroupMode | null>(initialMode ?? null);

  // Build the plan from live per-user data (rooms + today's DayPlan). Starts from
  // rooms alone and fills in the day plan once it loads — the move is never blocked.
  const [plan, setPlan] = useState<RegroupPlan>(() => buildRegroupPlan(projects, null));
  useEffect(() => {
    let live = true;
    loadDay().then(({ plan: day }) => {
      if (live) setPlan(buildRegroupPlan(projects, day));
    });
    return () => {
      live = false;
    };
  }, [projects]);

  // Esc closes; the flow never traps you.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pick = (m: RegroupMode) => {
    setMode(m);
    setBeat("move");
  };

  // Applying the move touches the user's REAL plan where the spec is explicit
  // ("Too much" defers the rest to tomorrow), and is otherwise a soft close.
  const applyMove = (m: RegroupMode, move: RegroupMove) => {
    if (m === "toomuch") {
      // Collapse today to its essentials; the rest visibly move to tomorrow.
      // PRACTICE: cognitive-load capping; planning fallacy correction.
      void deferNonEssential();
      setBeat("close");
    } else if (m === "tired") {
      onRested?.();
      setBeat("close");
    } else if (m === "broke") {
      const room = move.roomId ?? plan.thread[0]?.id ?? plan.oneThing.roomId;
      if (room && onStepIn) {
        onStepIn(room);
        onClose();
        return;
      }
      setBeat("close");
    } else {
      // Can't start: the reframe + micro-step is the whole intervention. Close soft.
      setBeat("close");
    }
  };

  // Non-destructive: keep the essential to-dos (or the single top one), park the
  // rest under "tomorrow". Reversible, and nothing is deleted. "Moved, not missed."
  const deferNonEssential = async () => {
    const { plan: day } = await loadDay();
    if (!day?.todos?.length) return;
    const live = day.todos.filter((t) => !t.done && !t.tomorrow);
    const keepIds = new Set(
      (live.some((t) => t.essential) ? live.filter((t) => t.essential) : live.slice(0, 1)).map((t) => t.id),
    );
    const next = day.todos.map((t) =>
      !t.done && !t.tomorrow && !keepIds.has(t.id) ? { ...t, tomorrow: true } : t,
    );
    await patchPlan({ todos: next });
  };

  const movedCount = mode === "toomuch"
    ? Math.max(0, plan.todos.length - Math.max(1, plan.todos.filter((t) => t.essential).length))
    : 0;

  return (
    <div className="regroup-scrim" onClick={onClose}>
      <div className="regroup" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="rg-x" onClick={onClose} aria-label="Close"><Icon.x /></button>
        <div className="rg-rule" />

        {safety ? (
          <SafetyNet onTalk={onTalk} triggerText={triggerText} />
        ) : beat === "validate" ? (
          <>
            {/* Beat 1 — Validate. Auto-shown, zero questions.
                PRACTICE: self-compassion; RSD-aware — never reference the abandoned plan. */}
            <p className="rg-validate">{COPY.validate}</p>
            <button className="rg-done" onClick={() => setBeat("triage")}>
              Okay <Icon.arrow style={{ width: 15, height: 15 }} />
            </button>
          </>
        ) : beat === "triage" ? (
          <>
            {/* Beat 2 — Triage. One tap, four big options, nothing to weigh. */}
            <p className="rg-validate" style={{ fontSize: 22 }}>{COPY.validate}</p>
            <p className="rg-lead">{COPY.triageLead}</p>
            <div className="rg-tiles">
              {TRIAGE.map((t) => (
                <button key={t.mode} className="rg-tile" onClick={() => pick(t.mode)}>
                  <span className="t">{t.title}</span>
                  <span className="s">{t.sub}</span>
                </button>
              ))}
            </div>
          </>
        ) : beat === "move" && mode ? (
          <MoveBeat
            mode={mode}
            plan={plan}
            movedTodos={mode === "toomuch" ? nonEssentialTitles(plan) : []}
            triggerText={triggerText}
            onApply={applyMove}
            onBack={initialMode ? undefined : () => setBeat("triage")}
          />
        ) : (
          <>
            {/* Beat 4 — Close soft. One line. No upsell, no streak talk. */}
            <p className="rg-close">{COPY.close}</p>
            {mode === "toomuch" && movedCount > 0 && (
              <p className="rg-close-sub">{COPY.tooMuch} — {movedCount} waiting for tomorrow.</p>
            )}
            <button className="rg-done" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

function nonEssentialTitles(plan: RegroupPlan): string[] {
  const hasEssential = plan.todos.some((t) => t.essential);
  const kept = hasEssential ? plan.todos.filter((t) => t.essential) : plan.todos.slice(0, 1);
  const keep = new Set(kept.map((t) => t.id));
  return plan.todos.filter((t) => !keep.has(t.id)).map((t) => t.title);
}

// Beat 3 — the matched move. Computed instantly from the live plan (works
// offline), then quietly sharpened by the server AI (per-user, requireUser-gated).
function MoveBeat({
  mode,
  plan,
  movedTodos,
  triggerText,
  onApply,
  onBack,
}: {
  mode: RegroupMode;
  plan: RegroupPlan;
  movedTodos: string[];
  triggerText?: string;
  onApply: (m: RegroupMode, move: RegroupMove) => void;
  onBack?: () => void;
}) {
  const [move, setMove] = useState<RegroupMove>(() => computeMove(mode, plan));

  // Recompute the client move if the plan finishes loading after mount.
  useEffect(() => {
    setMove(computeMove(mode, plan));
  }, [mode, plan]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/regroup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode, text: triggerText || "" }),
        });
        if (!res.ok || !live) return;
        const data = (await res.json()) as { move?: string; sub?: string };
        if (live && data.move) setMove((prev) => ({ ...prev, move: data.move!, sub: data.sub ?? prev.sub }));
      } catch {
        /* offline — the client move stands. */
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const moveLabel: Record<RegroupMode, string> = {
    cantstart: "The whole task",
    toomuch: "Today, capped",
    broke: "Step back in",
    tired: "The plan",
  };

  return (
    <div className="rg-move">
      <p className="rg-move-head">{move.validation}</p>
      <div className="rg-move-card">
        <div className="rg-move-label">{moveLabel[mode]}</div>
        <div className="rg-move-body">{move.move}</div>
        {move.sub && <div className="rg-move-sub">{move.sub}</div>}
        {mode === "toomuch" && movedTodos.length > 0 && (
          <div className="rg-moved-list">
            {movedTodos.map((t, i) => (
              <div key={i} className="mv"><span className="mk">tomorrow</span>{t}</div>
            ))}
          </div>
        )}
      </div>
      {/* the ONLY gold CTA in the flow */}
      <div>
        <button className="rg-cta" onClick={() => onApply(mode, move)}>
          {move.cta} <Icon.arrow />
        </button>
      </div>
      {onBack && (
        <button className="rg-back" onClick={onBack}><Icon.arrow />Something else</button>
      )}
    </div>
  );
}

// The Safety Net — served instead of any productivity move when the language is
// heavier than work. Warm one-liner + vetted resources + 988, gently noted, plus
// a quiet handoff to the Conversation spine (main's Help→talk integration).
// PRACTICE: stepped care — the tool knows its limits. Never diagnose, never store.
function SafetyNet({ onTalk, triggerText }: { onTalk?: (text: string) => void; triggerText?: string }) {
  return (
    <div className="rg-safety">
      <p className="rg-safe-lead">{COPY.safetyIntro}</p>
      <p className="rg-safe-sub">
        If it's heavier than work, these are here for you — real people, any time.
      </p>
      <div className="rg-resources">
        {SAFETY_RESOURCES.map((r) => (
          <a
            key={r.name}
            className="rg-resource"
            href={r.href}
            target={r.href?.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            <div className="rr-name">
              {r.name}
              {r.num && <> · <span className="rr-num">{r.num}</span></>}
            </div>
            <div className="rr-note">{r.note}</div>
          </a>
        ))}
      </div>
      {onTalk && (
        <button className="rg-done" style={{ marginTop: 18 }} onClick={() => onTalk(triggerText || "")}>
          Or just talk it through with me <Icon.arrow style={{ width: 15, height: 15 }} />
        </button>
      )}
    </div>
  );
}
