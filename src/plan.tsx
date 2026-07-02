import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { COS_DATA } from "./data";
import { daySeed } from "./brief";
import type { Accent } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// The Day Plan — Ollin's session-memory model of "today".
//
// The Front Page and Regroup both act on this one shrinkable plan. Everything
// here lives in SESSION MEMORY only: energy answers, shrink moves, and rest are
// never persisted, never counted, never logged.
// PRACTICE: no history/streaks/counters — a rescue tool must not keep score.
// ─────────────────────────────────────────────────────────────────────────────

export type Energy = "moving" | "low" | "broke";

export interface ThreadRoom {
  id: string;
  name: string;
  pick: string;
  when: string;
  accent: Accent;
}
export interface Todo {
  id: string;
  title: string;
  roomId: string | null;
  roomName: string | null;
  accent: Accent;
}
export interface OneThing {
  title: string;
  roomId: string | null;
  roomName: string | null;
  accent: Accent;
  micro: boolean;
}
export interface DayPlan {
  oneThing: OneThing;
  thread: ThreadRoom[];
  todos: Todo[];
  spark: string;
  buffer: boolean; // low-tank shrink applied?
}

// The base plan, derived from the workspace. Rooms = projects; the plan = today.
function deriveBase(): {
  oneThing: OneThing;
  thread: ThreadRoom[];
  todos: Todo[];
  spark: string;
} {
  const D = COS_DATA;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);
  const active = D.projects.filter((p) => p.status !== "dormant");

  // THE ONE THING — the single most useful move, sourced from the top live room.
  const lead = active[0] || D.projects[0];
  const oneThing: OneThing = {
    title: lead.nextAction || lead.focus,
    roomId: lead.id,
    roomName: lead.name,
    accent: lead.accent,
    micro: false,
  };

  // THE THREAD — recently touched rooms as one-liners.
  const thread: ThreadRoom[] = active.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    pick: p.resume?.[0]?.t || p.focus,
    when: p.away,
    accent: p.accent,
  }));

  // TODAY, LIGHTLY — real focus/meeting blocks, mapped to short lines (cap later).
  const todos: Todo[] = D.today.blocks
    .filter((b) => b.kind !== "ritual")
    .map((b, i) => {
      const p = b.proj ? projOf(b.proj) : null;
      return {
        id: `t${i}`,
        title: b.title,
        roomId: p?.id ?? null,
        roomName: p?.name ?? null,
        accent: (p?.accent ?? "blue") as Accent,
      };
    });

  // ONE SPARK — a single idea, rotated by the daily seed (stable within a day).
  const spark = D.sparks.length ? D.sparks[daySeed() % D.sparks.length] : "";

  return { oneThing, thread, todos, spark };
}

interface PlanState {
  energy: Energy | null;
  plan: DayPlan;
  /** The room to drop back into for "It broke" re-entry (most recently touched). */
  reentryRoomId: string | null;
  setEnergy: (e: Energy) => void;
  /** Re-open the Doorway check-in (energy badge is tappable to re-answer). */
  reopenCheckin: () => void;
  /** Can't start → shrink the One Thing below the initiation threshold. */
  applyMicroStep: (text: string) => void;
  /** Too much → collapse today to one item; the rest move to tomorrow. */
  applyCollapse: () => void;
  /** Just tired → clear today's pressure UI until tomorrow (data untouched). */
  applyRest: () => void;
  restMode: boolean;
  /** Count moved by the last collapse — shown as "Moved, not missed." */
  movedCount: number;
  clearRest: () => void;
}

const PlanContext = createContext<PlanState | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const base = useMemo(deriveBase, []);
  const [energy, setEnergyState] = useState<Energy | null>(null);
  const [restMode, setRestMode] = useState(false);
  const [oneThingOverride, setOneThingOverride] = useState<OneThing | null>(null);
  const [todosOverride, setTodosOverride] = useState<Todo[] | null>(null);
  const [movedCount, setMovedCount] = useState(0);

  const reentryRoomId = base.thread[0]?.id ?? null;

  const plan = useMemo<DayPlan>(() => {
    // Energy is load-bearing: low tank auto-shrinks the plan (fewer blocks, buffer).
    // PRACTICE: energy-matched activation — the plan meets the tank, not the ideal.
    const lowTank = energy === "low";
    let todos = todosOverride ?? base.todos;
    let buffer = false;
    if (!todosOverride) {
      if (lowTank) {
        todos = base.todos.slice(0, 2);
        buffer = true;
      } else {
        todos = base.todos.slice(0, 3);
      }
    }
    return {
      oneThing: oneThingOverride ?? base.oneThing,
      thread: base.thread,
      todos,
      spark: base.spark,
      buffer,
    };
  }, [base, energy, oneThingOverride, todosOverride]);

  const setEnergy = (e: Energy) => {
    setEnergyState(e);
    if (e !== "low") setRestMode(false);
  };

  const applyMicroStep = (text: string) => {
    setOneThingOverride({
      title: text,
      roomId: base.oneThing.roomId,
      roomName: base.oneThing.roomName,
      accent: base.oneThing.accent,
      micro: true,
    });
    setRestMode(false);
  };

  const applyCollapse = () => {
    const all = todosOverride ?? base.todos;
    const keep = all[0];
    if (keep) {
      setTodosOverride([keep]);
      setMovedCount(Math.max(0, all.length - 1));
      setOneThingOverride({
        title: keep.title,
        roomId: keep.roomId,
        roomName: keep.roomName,
        accent: keep.accent,
        micro: false,
      });
    }
    setRestMode(false);
  };

  const applyRest = () => setRestMode(true);
  const clearRest = () => setRestMode(false);
  const reopenCheckin = () => setEnergyState(null);

  return (
    <PlanContext.Provider
      value={{
        energy,
        plan,
        reentryRoomId,
        setEnergy,
        reopenCheckin,
        applyMicroStep,
        applyCollapse,
        applyRest,
        restMode,
        movedCount,
        clearRest,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
