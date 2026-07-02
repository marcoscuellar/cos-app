import type { EngineRun, CustomEngine, EngineField } from "./types";
import { IS_DEMO } from "./session";

// ── Custom engines — the owner's own engines, authored in-app ──────────────────

export async function loadCustomEngines(): Promise<CustomEngine[]> {
  if (IS_DEMO) return [];
  try {
    const r = await fetch("/api/engines");
    if (!r.ok) return [];
    const { engines } = (await r.json()) as { engines?: CustomEngine[] };
    return Array.isArray(engines) ? engines : [];
  } catch {
    return [];
  }
}

export async function saveCustomEngines(engines: CustomEngine[]): Promise<void> {
  if (IS_DEMO) return;
  try {
    await fetch("/api/engines", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ engines }),
      keepalive: true,
    });
  } catch {
    /* best effort */
  }
}

export interface EngineDraft {
  tagline: string;
  stages: string[];
  inputs: EngineField[];
  system: string;
}

/** Ask Ollin to draft a whole engine (prompt, inputs, stages) from a description. */
export async function assistEngine(name: string, desc: string): Promise<{ draft?: EngineDraft; error?: string }> {
  if (IS_DEMO) return { error: "This is a read-only demo." };
  try {
    const r = await fetch("/api/engine-assist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, desc }),
    });
    const data = (await r.json().catch(() => ({}))) as { draft?: EngineDraft; error?: string };
    if (!r.ok) return { error: data.error || "Couldn't draft that — try again." };
    return { draft: data.draft };
  } catch {
    return { error: "Network hiccup — try again." };
  }
}

// Client for /api/engine-run. Runs are heavy (live web search + a long Opus
// generation), so callers should show a patient working state.
// In the read-only demo, engines are sealed off — no saved runs, no live runs.

export async function loadRuns(engineId: string): Promise<EngineRun[]> {
  if (IS_DEMO) return [];
  try {
    const r = await fetch(`/api/engine-run?engine=${encodeURIComponent(engineId)}`);
    if (!r.ok) return [];
    const { runs } = (await r.json()) as { runs?: EngineRun[] };
    return runs ?? [];
  } catch {
    return [];
  }
}

/** Every run across all engines, newest first — for the Saved Runs view. */
export async function loadAllRuns(): Promise<EngineRun[]> {
  if (IS_DEMO) return [];
  try {
    const r = await fetch("/api/engine-run?all=1");
    if (!r.ok) return [];
    const { runs } = (await r.json()) as { runs?: EngineRun[] };
    return runs ?? [];
  } catch {
    return [];
  }
}

export async function runEngine(
  engineId: string,
  inputs: Record<string, string>,
  prompt: string,
  draft = false,
): Promise<{ run?: EngineRun; runs?: EngineRun[]; error?: string }> {
  if (IS_DEMO) return { error: "This is a read-only demo — engines don't run here." };
  try {
    const r = await fetch("/api/engine-run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ engineId, inputs, prompt, draft }),
    });
    const data = (await r.json().catch(() => ({}))) as { run?: EngineRun; runs?: EngineRun[]; error?: string };
    if (!r.ok) return { error: data.error || "The engine hit a snag — try again." };
    return data;
  } catch {
    return { error: "Network hiccup — try again." };
  }
}

export async function patchRun(
  engineId: string,
  runId: string,
  patch: { notes?: string; starred?: boolean },
): Promise<EngineRun[]> {
  if (IS_DEMO) return [];
  try {
    const r = await fetch("/api/engine-run", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ engineId, runId, ...patch }),
    });
    if (!r.ok) return [];
    const { runs } = (await r.json()) as { runs?: EngineRun[] };
    return runs ?? [];
  } catch {
    return [];
  }
}
