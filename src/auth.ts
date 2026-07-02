import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

// Client for /api/auth — the passkey lock on the real account. Each call resolves
// to a small result the LockScreen can render; errors come back as readable text.

export interface AuthStatus { authed: boolean }

const post = (action: string, body?: unknown) =>
  fetch(`/api/auth?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...(body as object) }),
  });

export async function authStatus(): Promise<AuthStatus> {
  try {
    const r = await fetch("/api/auth?action=status");
    if (!r.ok) return { authed: false };
    return (await r.json()) as AuthStatus;
  } catch {
    return { authed: false };
  }
}

// Shared passkey-enrollment dance; `body` selects the path server-side
// (empty → open signup; {invite,code} → invite or owner override).
async function enroll(body: Record<string, unknown>): Promise<{ ok?: boolean; error?: string }> {
  try {
    const optRes = await post("register-options", body);
    const opt = await optRes.json();
    if (!optRes.ok) return { error: opt.error || "Couldn't start setup." };

    const attestation = await startRegistration({ optionsJSON: opt });

    const verRes = await post("register-verify", { response: attestation });
    const ver = await verRes.json();
    if (!verRes.ok) return { error: ver.error || "Couldn't finish setup." };
    return { ok: true };
  } catch (e) {
    return { error: humanError(e) };
  }
}

/** Open signup: create an account with a passkey, no code. Server enforces the cap. */
export const registerOpen = () => enroll({});

/**
 * Create an account with an invite code — the owner override that bypasses the cap.
 * The same field also accepts the owner's setup code (the server disambiguates).
 */
export const registerPasskey = (code: string) => enroll({ invite: code, code });

/** Unlock with the registered passkey (Touch ID / Face ID / Windows Hello). */
export async function loginPasskey(): Promise<{ ok?: boolean; error?: string }> {
  try {
    const optRes = await post("login-options");
    const opt = await optRes.json();
    if (!optRes.ok) return { error: opt.error || "Couldn't start unlock." };

    const assertion = await startAuthentication({ optionsJSON: opt });

    const verRes = await post("login-verify", { response: assertion });
    const ver = await verRes.json();
    if (!verRes.ok) return { error: ver.error || "Passkey didn't verify." };
    return { ok: true };
  } catch (e) {
    return { error: humanError(e) };
  }
}

/** Break-glass: the setup code clears the lost passkey so a fresh one can enroll. */
export async function recover(code: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    const r = await post("recover", { code });
    const d = await r.json();
    if (!r.ok) return { error: d.error || "Recovery failed." };
    return { ok: true };
  } catch (e) {
    return { error: humanError(e) };
  }
}

function humanError(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError") return "Cancelled — no passkey was used.";
  if (name === "InvalidStateError") return "This device already has a passkey for this account.";
  return (e as Error)?.message || "Something went wrong.";
}
