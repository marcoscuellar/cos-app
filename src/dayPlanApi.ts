import type { DayPlan, Note, PlannedBlock, TodoItem } from "./types";
import { IS_DEMO } from "./session";

// Client for /api/plan-day. The planner returns today's full DayPlan (or null
// when nothing is planned yet). The brain-dump → schedule call can take several
// seconds (the AI is thinking), so callers should show a building state.
// In the read-only demo, the planner is sealed off — no reads, no AI, no writes.

const DEMO_BLOCKED = "This is a read-only demo — building a day is off here.";

export interface LoadedDay {
  plan: DayPlan | null;
  /** Yesterday's still-open to-dos, offered back as "From yesterday". */
  carryover: TodoItem[];
}

export async function loadDay(): Promise<LoadedDay> {
  if (IS_DEMO) return { plan: null, carryover: [] };
  try {
    const r = await fetch("/api/plan-day");
    if (!r.ok) return { plan: null, carryover: [] };
    const { plan, carryover } = (await r.json()) as { plan?: DayPlan | null; carryover?: TodoItem[] };
    return { plan: plan ?? null, carryover: carryover ?? [] };
  } catch {
    return { plan: null, carryover: [] };
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
  if (IS_DEMO) return { error: DEMO_BLOCKED };
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

/** Edit just today's intention on the saved plan (no AI). Returns the updated plan. */
export async function updateIntention(intention: string): Promise<DayPlan | null> {
  if (IS_DEMO) return null;
  try {
    const r = await fetch("/api/plan-day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intention }),
    });
    if (!r.ok) return null;
    const { plan } = (await r.json()) as { plan?: DayPlan | null };
    return plan ?? null;
  } catch {
    return null;
  }
}

/** Save an edited blocks array (reschedule / rename / check off / add / delete). */
export async function saveBlocks(blocks: PlannedBlock[]): Promise<DayPlan | null> {
  if (IS_DEMO) return null;
  try {
    const r = await fetch("/api/plan-day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!r.ok) return null;
    const { plan } = (await r.json()) as { plan?: DayPlan | null };
    return plan ?? null;
  } catch {
    return null;
  }
}

/** Patch today's to-dos, journal, notes, and/or carry-over flag (no AI). Works even before a brain-dump. */
export async function patchPlan(patch: { todos?: TodoItem[]; notes?: string; journal?: Note[]; carryDone?: boolean }): Promise<DayPlan | null> {
  if (IS_DEMO) return null;
  try {
    const r = await fetch("/api/plan-day", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
      keepalive: true,
    });
    if (!r.ok) return null;
    const { plan } = (await r.json()) as { plan?: DayPlan | null };
    return plan ?? null;
  } catch {
    return null;
  }
}

export async function clearPlan(): Promise<void> {
  if (IS_DEMO) return;
  try {
    await fetch("/api/plan-day", { method: "DELETE" });
  } catch {
    /* best effort */
  }
}
