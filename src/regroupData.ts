import type { Project, DayPlan } from "./types";
import type { RegroupPlan } from "./regroup";

// ─────────────────────────────────────────────────────────────────────────────
// Build the Regroup plan from the signed-in user's LIVE data — their rooms
// (projects) and today's DayPlan (intention + to-dos). This is the on-main
// replacement for the old static-data derivation: the rescue move is computed
// from what the user is actually carrying today.
// ─────────────────────────────────────────────────────────────────────────────

export function buildRegroupPlan(projects: Project[], day: DayPlan | null): RegroupPlan {
  const active = projects.filter((p) => !p.archived && p.status !== "dormant");
  const lead = active[0] || projects[0] || null;

  // Today's live to-dos (not done, not already parked for tomorrow).
  const liveTodos = (day?.todos || []).filter((t) => !t.done && !t.tomorrow);

  // THE ONE THING — the day's intention if the user set one, else their truest
  // must-do (an essential to-do), else the lead room's next action.
  const essential = liveTodos.find((t) => t.essential) || liveTodos[0];
  const oneThingTitle =
    (day?.intention && day.intention.trim()) ||
    (essential && essential.text) ||
    (lead && (lead.nextAction || lead.focus)) ||
    "Pick one small thing.";

  return {
    oneThing: {
      title: oneThingTitle,
      roomId: lead ? lead.id : null,
      roomName: lead ? lead.name : null,
    },
    todos: liveTodos.map((t) => ({ id: t.id, title: t.text, essential: t.essential })),
    thread: active.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      pick: p.resume?.[0]?.t || p.focus || p.nextAction || "pick up where you left off",
      when: p.away,
    })),
  };
}
