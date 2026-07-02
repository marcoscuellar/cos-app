import { kvGet, kvGetRaw, kvSet, kvDel, kvScan, kvSAdd } from "./kv.js";
import { OWNER_UID } from "./session.js";

// ─────────────────────────────────────────────────────────────────────────────
// One-time owner migration: the pre-multiuser owner (`cos-auth:owner` + the
// `*:me` data keys) is moved into the `user:me:*` namespace.
//
// This runs before ANY data access — every data endpoint calls ensureOwnerMigrated()
// right after resolving the session — so the owner can never write to `user:me:*`
// before their legacy `*:me` data has been moved (which would otherwise orphan it).
// Idempotent and guarded by a durable flag + an in-instance memo.
// ─────────────────────────────────────────────────────────────────────────────

const FLAG_KEY = "ollin:owner-migrated";
const LEGACY_OWNER_KEY = "cos-auth:owner";
const USERS_KEY = "ollin:users";
const credKey = (id: string) => `cred:${id}`;
const userCredsKey = (uid: string) => `user:${uid}:creds`;
const userMetaKey = (uid: string) => `user:${uid}:meta`;

interface StoredCredential { id: string; publicKey: string; counter: number; transports?: string[] }

let migratedThisInstance = false;

// Copy oldKey → newKey verbatim (raw JSON string), never clobbering an existing
// newKey, then drop the old. Safe to re-run.
async function rekey(oldKey: string, newKey: string): Promise<void> {
  if ((await kvGetRaw(newKey)) !== null) return;
  const raw = await kvGetRaw(oldKey);
  if (raw === null) return;
  await kvSet(newKey, raw);
  await kvDel(oldKey);
}

export async function ensureOwnerMigrated(): Promise<void> {
  if (migratedThisInstance) return;
  if (await kvGet<boolean>(FLAG_KEY)) { migratedThisInstance = true; return; }

  const legacy = await kvGet<{ credential: StoredCredential; createdAt?: number }>(LEGACY_OWNER_KEY);
  if (legacy?.credential) {
    if ((await kvGetRaw(userCredsKey(OWNER_UID))) === null) {
      await kvSet(userCredsKey(OWNER_UID), [legacy.credential]);
      if ((await kvGetRaw(credKey(legacy.credential.id))) === null) {
        await kvSet(credKey(legacy.credential.id), OWNER_UID);
      }
      await kvSet(userMetaKey(OWNER_UID), { createdAt: legacy.createdAt ?? Date.now(), lastActive: Date.now(), founding: true });
      await kvSAdd(USERS_KEY, OWNER_UID);
    }
    await rekey(`projects:${OWNER_UID}`, `user:${OWNER_UID}:projects`);
    await rekey(`engines:${OWNER_UID}`, `user:${OWNER_UID}:engines`);
    for (const k of await kvScan(`plan:${OWNER_UID}:*`)) {
      await rekey(k, `user:${OWNER_UID}:plan:${k.slice(`plan:${OWNER_UID}:`.length)}`);
    }
    for (const k of await kvScan(`notes:${OWNER_UID}:*`)) {
      await rekey(k, `user:${OWNER_UID}:notes:${k.slice(`notes:${OWNER_UID}:`.length)}`);
    }
    for (const k of await kvScan(`engine:runs:${OWNER_UID}:*`)) {
      await rekey(k, `user:${OWNER_UID}:engine:runs:${k.slice(`engine:runs:${OWNER_UID}:`.length)}`);
    }
    await kvDel(LEGACY_OWNER_KEY);
  }

  await kvSet(FLAG_KEY, true);
  migratedThisInstance = true;
}
