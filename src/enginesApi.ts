import type { EngineRun } from "./types";

// Client for /api/engine-run. Runs are heavy (live web search + a long Opus
// generation), so callers should show a patient working state.

export async function loadRuns(engineId: string): Promise<EngineRun[]> {
  try {
    const r = await fetch(`/api/engine-run?engine=${encodeURIComponent(engineId)}`);
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
): Promise<{ run?: EngineRun; runs?: EngineRun[]; error?: string }> {
  try {
    const r = await fetch("/api/engine-run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ engineId, inputs, prompt }),
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
