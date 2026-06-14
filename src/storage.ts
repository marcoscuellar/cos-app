export interface PersistedState {
  route?: string;
  projectId?: string | null;
  collapsed?: boolean;
}

const CLIENT_ID_KEY = "cos-client-id";
const CACHE_KEY = "cos-state";

/** A stable, opaque per-browser id used to key this browser's state in KV. */
function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — ephemeral id for this load.
    return crypto.randomUUID();
  }
}

function readCache(): PersistedState | null {
  try {
    const c = localStorage.getItem(CACHE_KEY);
    return c ? (JSON.parse(c) as PersistedState) : null;
  } catch {
    return null;
  }
}

function writeCache(state: PersistedState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Load persisted state from Vercel KV (via /api/state), falling back to the
 * localStorage cache when the API is unavailable (e.g. `vite` dev without KV).
 */
export async function loadState(): Promise<PersistedState | null> {
  const id = getClientId();
  try {
    const r = await fetch(`/api/state?id=${encodeURIComponent(id)}`);
    if (r.ok) {
      const { state } = (await r.json()) as { state: PersistedState | null };
      if (state) {
        writeCache(state);
        return state;
      }
      return readCache();
    }
  } catch {
    /* network/API unavailable — fall through to cache */
  }
  return readCache();
}

/**
 * Persist state to Vercel KV (best effort) and mirror it to the localStorage
 * cache so a reload is instant and survives the API being offline.
 */
export function saveState(state: PersistedState): void {
  const id = getClientId();
  writeCache(state);
  try {
    void fetch(`/api/state`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, state }),
      keepalive: true,
    });
  } catch {
    /* best effort */
  }
}
