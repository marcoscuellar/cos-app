import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { usePlan } from "../plan";
import {
  COPY,
  TRIAGE,
  computeMove,
  SAFETY_RESOURCES,
  type RegroupMode,
  type RegroupMove,
} from "../regroup";

// ─────────────────────────────────────────────────────────────────────────────
// Regroup — the rescue takeover. A calm modal panel on green, ONE thing per beat.
//
// Hard rules (spec §2.4), enforced structurally here:
//   • No history, no counters, no logs — this component stores NOTHING. It reads
//     the plan, applies one move, and closes. Session memory only.
//   • Max ONE gold CTA visible per beat. Gold appears only on the matched move
//     and nowhere else; every other action is a quiet outline.
//   • Ollin voice: short, kind, zero clinical jargon on-screen.
// ─────────────────────────────────────────────────────────────────────────────

type Beat = "validate" | "triage" | "move" | "close";

interface RegroupProps {
  onClose: () => void;
  /** Jump straight to a matched move (e.g. Doorway "It broke" → Beat 3/broke). */
  initialMode?: RegroupMode | null;
  /** Open pre-validated straight into triage (distress detected in the input). */
  preValidated?: boolean;
  /** Heavier-than-work language → serve the Safety Net, never a productivity move. */
  safety?: boolean;
  /** The text that triggered Regroup — sent to sharpen the move, never stored. */
  triggerText?: string;
  /** Navigate into a room (for "It broke" / re-entry). */
  onStepIn?: (roomId: string) => void;
}

export function Regroup({ onClose, initialMode, preValidated, safety, triggerText, onStepIn }: RegroupProps) {
  const plan = usePlan();

  const firstBeat: Beat = initialMode ? "move" : preValidated ? "triage" : "validate";
  const [beat, setBeat] = useState<Beat>(firstBeat);
  const [mode, setMode] = useState<RegroupMode | null>(initialMode ?? null);

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

  // Applying the move mutates the SESSION plan, then closes soft (Beat 4).
  const applyMove = (m: RegroupMode, move: RegroupMove) => {
    if (m === "cantstart") plan.applyMicroStep(move.move);
    else if (m === "toomuch") plan.applyCollapse();
    else if (m === "tired") plan.applyRest();
    else if (m === "broke") {
      const room = move.roomId ?? plan.reentryRoomId;
      if (room && onStepIn) {
        onStepIn(room);
        onClose();
        return;
      }
    }
    setBeat("close");
  };

  return (
    <div className="regroup-scrim" onClick={onClose}>
      <div className="regroup" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="rg-x" onClick={onClose} aria-label="Close"><Icon.x /></button>
        <div className="rg-rule" />

        {safety ? (
          <SafetyNet />
        ) : beat === "validate" ? (
          <>
            {/* Beat 1 — Validate. Auto-shown, zero questions.
                PRACTICE: self-compassion response; RSD-aware — never reference the abandoned plan. */}
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
            triggerText={triggerText}
            onApply={applyMove}
            onBack={initialMode ? undefined : () => setBeat("triage")}
          />
        ) : (
          <>
            {/* Beat 4 — Close soft. One line. No upsell, no streak talk. */}
            <p className="rg-close">{COPY.close}</p>
            <button className="rg-done" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

// Beat 3 — the matched move. Computed instantly from the plan (works offline),
// then quietly sharpened by the server AI if it's reachable.
function MoveBeat({
  mode,
  triggerText,
  onApply,
  onBack,
}: {
  mode: RegroupMode;
  triggerText?: string;
  onApply: (m: RegroupMode, move: RegroupMove) => void;
  onBack?: () => void;
}) {
  const plan = usePlan();
  const [move, setMove] = useState<RegroupMove>(() => computeMove(mode, plan.plan));

  useEffect(() => {
    let live = true;
    // Optimistic: the client move already shows. The server only refines the text.
    (async () => {
      try {
        const res = await fetch("/api/regroup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mode,
            text: triggerText || "",
            plan: {
              oneThing: plan.plan.oneThing.title,
              room: plan.plan.oneThing.roomName,
              todos: plan.plan.todos.map((t) => t.title),
              rooms: plan.plan.thread.map((r) => ({ name: r.name, pick: r.pick })),
            },
          }),
        });
        if (!res.ok || !live) return;
        const data = (await res.json()) as { move?: string; sub?: string };
        if (live && data.move) {
          setMove((prev) => ({ ...prev, move: data.move!, sub: data.sub ?? prev.sub }));
        }
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
        {mode === "toomuch" && plan.plan.todos.length > 1 && (
          <div className="rg-moved-list">
            {plan.plan.todos.slice(1).map((t) => (
              <div key={t.id} className="mv"><span className="mk">tomorrow</span>{t.title}</div>
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
// heavier than work. Warm one-liner + vetted resources + 988, gently noted.
// PRACTICE: stepped care — the tool knows its limits. Never diagnose, never store.
function SafetyNet() {
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
    </div>
  );
}
