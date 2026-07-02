import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runRegroupMove, detectDistress, type RegroupMode, type RegroupPlan } from "../lib/server/ai/regroup.js";
import { providerConfigured, ProviderError } from "../lib/server/ai/provider.js";
import { requireUser, unauthorized } from "../lib/server/session.js";
import { kvConfigured, kvGet } from "../lib/server/kv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Regroup — HTTP entry point for the app's one rescue flow. Thin, like api/ask.ts.
//
// Session-gated exactly like the other data endpoints: the user id comes ONLY
// from the signed session cookie (requireUser), never the body. The matched move
// is computed server-side from the caller's OWN namespace — `user:<uid>:projects`
// (rooms) and `user:<uid>:plan:<date>` (today's intention + to-dos) — so a rescue
// is grounded in their real day, and no one can read another user's plan.
//
// Modes:
//   detect                       → { intent: distress | safety | none }
//   cantstart|toomuch|broke|tired → { move, sub }
//
// PRACTICE: no history/counters/logs — this handler persists nothing about the
// call. Session memory only. If AI is unconfigured we 503 and the client's own
// offline move (regroup.ts → computeMove) stands unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const MOVE_MODES: RegroupMode[] = ["cantstart", "toomuch", "broke", "tired"];

const TZ = "America/Chicago";
const dateKey = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const planKey = (uid: string) => `user:${uid}:plan:${dateKey()}`;
const projectsKey = (uid: string) => `user:${uid}:projects`;

interface StoredTodo { text?: string; done?: boolean; tomorrow?: boolean; essential?: boolean }
interface StoredPlan { intention?: string; todos?: StoredTodo[] }
interface StoredProject {
  name?: string; status?: string; archived?: boolean; focus?: string; nextAction?: string;
  resume?: { t?: string }[];
}

// Assemble the server-side view of the user's plan for the prompt.
async function loadRegroupPlan(uid: string): Promise<RegroupPlan> {
  const [plan, projects] = await Promise.all([
    kvGet<StoredPlan>(planKey(uid)),
    kvGet<StoredProject[]>(projectsKey(uid)),
  ]);
  const rooms = Array.isArray(projects) ? projects : [];
  const active = rooms.filter((p) => !p.archived && p.status !== "dormant");
  const liveTodos = (plan?.todos || []).filter((t) => t.text && !t.done && !t.tomorrow);
  const essential = liveTodos.find((t) => t.essential) || liveTodos[0];
  const lead = active[0] || rooms[0];
  return {
    oneThing:
      (plan?.intention && plan.intention.trim()) ||
      essential?.text ||
      lead?.nextAction ||
      lead?.focus ||
      "",
    room: lead?.name ?? null,
    todos: liveTodos.map((t) => t.text as string),
    rooms: active.slice(0, 4).map((p) => ({
      name: p.name || "a room",
      pick: p.resume?.[0]?.t || p.focus || p.nextAction || "pick up where you left off",
    })),
  };
}

interface RegroupBody {
  mode?: string;
  text?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!providerConfigured()) {
    return res.status(503).json({ error: "AI is not configured." });
  }
  // Session-gated: identity from the cookie only.
  const uid = await requireUser(req);
  if (!uid) return unauthorized(res);

  const body = (req.body ?? {}) as RegroupBody;
  const mode = typeof body.mode === "string" ? body.mode : "";

  try {
    if (mode === "detect") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return res.status(400).json({ error: "No text provided." });
      const intent = await detectDistress(text);
      return res.status(200).json({ intent });
    }

    if (MOVE_MODES.includes(mode as RegroupMode)) {
      // Read the caller's own plan/rooms from their KV namespace (best effort —
      // an empty plan just yields a gentler, generic move).
      const plan = kvConfigured() ? await loadRegroupPlan(uid) : {};
      const result = await runRegroupMove(mode as RegroupMode, plan);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "Unknown mode." });
  } catch (err) {
    if (err instanceof ProviderError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unexpected error." });
  }
}
