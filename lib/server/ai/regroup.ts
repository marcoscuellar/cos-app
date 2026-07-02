import { getProvider, type AIProvider } from "./provider.js";

// ─────────────────────────────────────────────────────────────────────────────
// Regroup — server-side move computation + distress intent check.
//
// The clinical practices are encoded in the system prompt so the model's output
// stays inside the intervention, not generic productivity advice. This module is
// STATELESS: it reads the plan the client sent, returns one move, stores nothing.
// PRACTICE: no logging of Regroup events — session memory only, even on the server.
// ─────────────────────────────────────────────────────────────────────────────

export type RegroupMode = "cantstart" | "toomuch" | "broke" | "tired";

export interface RegroupPlan {
  oneThing?: string;
  room?: string | null;
  todos?: string[];
  rooms?: { name: string; pick: string }[];
}

const BASE =
  "You are Ollin, a calm companion for someone with ADHD who has hit a wall mid-day. " +
  "Your voice is short, warm, and plain — zero clinical jargon, zero cheerleading, zero streak/score talk. " +
  "Never reference an abandoned plan or imply failure (rejection-sensitive). Return STRICT JSON only: " +
  '{"move":"<one short line>","sub":"<one short supporting line>"}. No prose outside the JSON.';

const MODE_INSTRUCTION: Record<RegroupMode, string> = {
  // PRACTICE: behavioral activation / task chunking below initiation threshold.
  cantstart:
    "Shrink their One Thing to a single physical micro-step smaller than their resistance — " +
    "something doable in under a minute (e.g. 'Just open the doc and type one word.'). " +
    "The 'move' is that micro-step. The 'sub' reassures them that's the whole task.",
  // PRACTICE: cognitive-load capping; planning fallacy correction.
  toomuch:
    "Pick the SINGLE most worthwhile item from their list to keep today; everything else waits for tomorrow. " +
    "The 'move' names that one item. The 'sub' is a calm 'Moved, not missed.'-style line — no red, no 'overdue'.",
  // PRACTICE: context reinstatement for set-shifting deficits.
  broke:
    "They lost the thread. Point them at the most recently touched room with its context so they can walk back in cold-proof. " +
    "The 'move' is the re-entry line. The 'sub' reassures them nothing moved while they were gone.",
  // PRACTICE: pacing / energy-based activation over push-through.
  tired:
    "Offer rest as a valid plan. The 'move' gives them permission to put it down; the 'sub' reassures them nothing expires and Ollin is holding it all.",
};

function buildPlanText(plan: RegroupPlan): string {
  const lines: string[] = [];
  if (plan.oneThing) lines.push(`One Thing: ${plan.oneThing}${plan.room ? ` (room: ${plan.room})` : ""}`);
  if (plan.todos?.length) lines.push(`Today's list: ${plan.todos.join("; ")}`);
  if (plan.rooms?.length)
    lines.push(`Recent rooms: ${plan.rooms.map((r) => `${r.name} → ${r.pick}`).join("; ")}`);
  return lines.join("\n") || "(no plan details provided)";
}

export interface RegroupResult {
  move: string;
  sub?: string;
}

export async function runRegroupMove(
  mode: RegroupMode,
  plan: RegroupPlan,
  provider: AIProvider = getProvider(),
): Promise<RegroupResult> {
  const system = `${BASE}\n\nSITUATION: ${MODE_INSTRUCTION[mode]}\n\n=== THEIR PLAN ===\n${buildPlanText(plan)}\n=== END ===`;
  const raw = await provider.generate({ system, user: "Give me the move.", maxTokens: 160 });
  return parseResult(raw);
}

function parseResult(raw: string): RegroupResult {
  const text = raw.trim();
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      const obj = JSON.parse(text.slice(start, end + 1)) as { move?: string; sub?: string };
      if (obj.move) return { move: String(obj.move).trim(), sub: obj.sub ? String(obj.sub).trim() : undefined };
    }
  } catch {
    /* fall through */
  }
  // Non-JSON reply — use the first line as the move.
  return { move: text.split("\n")[0].slice(0, 200) };
}

// ── Distress intent check — the server fallback for phrasing the keyword list misses.
// PRACTICE: stepped care — safety outranks productivity; when unsure, escalate to safety.
export type Intent = "distress" | "safety" | "none";

export async function detectDistress(text: string, provider: AIProvider = getProvider()): Promise<Intent> {
  const system =
    "Classify a short message from someone using an ADHD support app. Respond with ONE word only:\n" +
    "- 'safety' if it signals hopelessness, self-harm, worthlessness, or anything heavier than work/productivity.\n" +
    "- 'distress' if it signals being stuck, overwhelmed, unable to start, or generally struggling with work.\n" +
    "- 'none' otherwise.\n" +
    "When torn between 'safety' and 'distress', choose 'safety'. Output only the single word.";
  const raw = (await provider.generate({ system, user: text, maxTokens: 6 })).toLowerCase();
  if (raw.includes("safety")) return "safety";
  if (raw.includes("distress")) return "distress";
  return "none";
}
