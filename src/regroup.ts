import type { DayPlan } from "./plan";

// ─────────────────────────────────────────────────────────────────────────────
// Regroup — the rescue flow's copy, detection, and matched-move logic.
//
// Rule zero: every branch here operationalizes a clinical ADHD practice. The
// PRACTICE annotations are load-bearing — do not strip them.
// ─────────────────────────────────────────────────────────────────────────────

export type RegroupMode = "cantstart" | "toomuch" | "broke" | "tired";
export type DetectIntent = "distress" | "safety" | null;

// ── Copy deck (verbatim from spec §4) ────────────────────────────────────────
export const COPY = {
  validate: "Okay. You showed up — that's the hard part. Nothing here is broken.",
  triageLead: "What's the shape of it right now?",
  broke: "You paused. You didn't fail.",
  tired: "Low tank is real. Ollin's holding everything; nothing expires.",
  tooMuch: "Moved, not missed.",
  close: "Here when you need me.",
  doorwayAsk: "Where's your energy at?",
  safetyIntro:
    "This sounds heavier than work. That's okay — and it's not something a planner should carry alone.",
} as const;

export interface TriageTile {
  mode: RegroupMode;
  title: string;
  sub: string;
}

// Beat 2 — four big options, one tap.
// PRACTICE: intervention matched to state (CBT-for-adult-ADHD), not one-size-fits-all.
export const TRIAGE: TriageTile[] = [
  { mode: "cantstart", title: "Can't start", sub: "It won't begin." },
  { mode: "toomuch", title: "Too much", sub: "The day is too big." },
  { mode: "broke", title: "It broke", sub: "I lost the thread." },
  { mode: "tired", title: "Just tired", sub: "The tank is low." },
];

export interface RegroupMove {
  /** The warm validation line for this move (verbatim copy). */
  validation: string;
  /** The matched move text — computed from the user's real plan. */
  move: string;
  /** Optional supporting sub-line. */
  sub?: string;
  /** The single gold CTA label. */
  cta: string;
  /** Which room this move points at, if any (for re-entry). */
  roomId?: string | null;
}

// ── Client-side deterministic move (works fully offline) ─────────────────────
// The server may sharpen the `move` text via AI, but the client can always
// compute a sound move from the plan it already holds — same graceful-degradation
// contract as Ask COS / Brainstorm.
export function computeMove(mode: RegroupMode, plan: DayPlan): RegroupMove {
  switch (mode) {
    case "cantstart": {
      // Shrink the One Thing below the initiation threshold to a single micro-step.
      // PRACTICE: behavioral activation / task chunking below initiation threshold.
      const target = plan.oneThing.title;
      const micro = microStep(target);
      return {
        validation: "Let's make it smaller than your resistance.",
        move: micro,
        sub: "That's the whole task. Nothing after it counts right now.",
        cta: "That I can do",
        roomId: plan.oneThing.roomId,
      };
    }
    case "toomuch": {
      // Collapse today to ONE item; the rest visibly move to tomorrow.
      // PRACTICE: cognitive-load capping; planning fallacy correction.
      const keep = plan.todos[0]?.title || plan.oneThing.title;
      return {
        validation: "Let's cap it. One thing, and the rest waits.",
        move: keep,
        sub: COPY.tooMuch,
        cta: "One thing it is",
      };
    }
    case "broke": {
      // One re-entry door into the most recently touched room, with its context.
      // PRACTICE: context reinstatement for set-shifting deficits.
      const room = plan.thread[0];
      return {
        validation: COPY.broke,
        move: room ? `${room.name} — pick up: ${room.pick}` : plan.oneThing.title,
        sub: "Step back into exactly where you were. Nothing moved while you were gone.",
        cta: "Step back in",
        roomId: room?.id ?? plan.oneThing.roomId,
      };
    }
    case "tired": {
      // Rest offered as a valid plan; today's pressure clears until tomorrow.
      // PRACTICE: pacing / energy-based activation over push-through.
      return {
        validation: COPY.tired,
        move: "Nothing here expires. Put it down.",
        sub: "Ollin's holding the whole thread. It'll be exactly here tomorrow.",
        cta: "Rest. Ollin's got it",
      };
    }
  }
}

// Turn a task into a below-threshold opener ("Just open the doc. That's the whole task.").
function microStep(task: string): string {
  const t = (task || "").trim().replace(/\.$/, "");
  if (!t) return "Just open the file. That's the whole task.";
  const low = t.toLowerCase();
  if (/\b(write|draft|essay|post|one-pager|note)\b/.test(low))
    return "Just open the doc and type one line. That's the whole task.";
  if (/\b(spec|engine|logic|api|rubric|routing)\b/.test(low))
    return "Just open the spec and read the last paragraph. That's the whole task.";
  if (/\b(decide|decision|choose|pick)\b/.test(low))
    return "Just write the two options down. That's the whole task.";
  if (/\b(review|read|export)\b/.test(low))
    return "Just open it and skim the first screen. That's the whole task.";
  return `Just open ${firstNoun(t)}. That's the whole task.`;
}

function firstNoun(task: string): string {
  const words = task.split(/\s+/).slice(0, 3).join(" ");
  return words.toLowerCase();
}

// ── Distress + safety detection (client tier — fast, offline, case-insensitive) ─
// PRACTICE: stepped care — the tool knows its limits; safety outranks productivity.
const SAFETY_TERMS = [
  "can't do this anymore",
  "cant do this anymore",
  "hopeless",
  "worthless",
  "no point",
  "give up on everything",
  "hate myself",
  "want to disappear",
  "don't want to be here",
  "dont want to be here",
  "end it",
  "kill myself",
  "hurt myself",
  "want to die",
  "better off without me",
];

const DISTRESS_TERMS = [
  "help",
  "stuck",
  "can't start",
  "cant start",
  "kicking my ass",
  "kick my ass",
  "drowning",
  "overwhelmed",
  "overwhelm",
  "falling apart",
  "i give up",
  "too much",
  "can't do this",
  "cant do this",
  "cant focus",
  "can't focus",
  "paralyzed",
  "frozen",
  "behind on everything",
];

function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Fast keyword intent check. Safety is tested FIRST and always wins, so heavier-
 * than-productivity language can never be answered with a productivity move.
 * Returns null when nothing matches (caller may then fall back to the server check).
 */
export function detectIntent(text: string): DetectIntent {
  const t = norm(text);
  if (!t) return null;
  if (SAFETY_TERMS.some((k) => t.includes(k))) return "safety";
  if (DISTRESS_TERMS.some((k) => t.includes(k))) return "distress";
  return null;
}

// Vetted resources shown in the Safety Net panel. Never stored, never counted.
export interface SafetyResource {
  name: string;
  note: string;
  href?: string;
  num?: string;
}
export const SAFETY_RESOURCES: SafetyResource[] = [
  { name: "988 Suicide & Crisis Lifeline", note: "Call or text · 24/7 · free & confidential (US)", num: "988", href: "tel:988" },
  { name: "Crisis Text Line", note: "Text HOME to 741741 (US)", href: "sms:741741" },
  { name: "Find a helpline", note: "International directory of free support lines", href: "https://findahelpline.com" },
];
