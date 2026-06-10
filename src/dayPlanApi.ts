import type { DayPlan } from "./types";

// Client for /api/plan-day. The planner returns today's full DayPlan (or null
// when nothing is planned yet). The brain-dump → schedule call can take several
// seconds (the AI is thinking), so callers should show a building state.

export async function loadPlan(): Promise<DayPlan | null> {
  try {
    const r = await fetch("/api/plan-day");
    if (!r.ok) return null;
    const { plan } = (await r.json()) as { plan?: DayPlan | null };
    return plan ?? null;
  } catch {
    return null;
  }
}

export interface PlanRequest {
  dump: string;
  rooms: { id: string; name: string }[];
  hours: string;
  pacing: string;
}

/** Returns the new plan, or an error message string on failure. */
export async function buildPlan(req: PlanRequest): Promise<{ plan?: DayPlan; error?: string }> {
  try {
    const r = await fetch("/api/plan-day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    const data = (await r.json().catch(() => ({}))) as { plan?: DayPlan; error?: string };
    if (!r.ok) return { error: data.error || "Couldn't build your day — try again." };
    return { plan: data.plan };
  } catch {
    return { error: "Network hiccup — try again." };
  }
}

export async function clearPlan(): Promise<void> {
  try {
    await fetch("/api/plan-day", { method: "DELETE" });
  } catch {
    /* best effort */
  }
}
