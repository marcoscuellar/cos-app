import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

// Client for /api/auth — the passkey lock on the real account. Each call resolves
// to a small result the LockScreen can render; errors come back as readable text.

export interface AuthStatus { ownerSet: boolean; authed: boolean }

const post = (action: string, body?: unknown) =>
  fetch(`/api/auth?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...(body as object) }),
  });

export async function authStatus(): Promise<AuthStatus> {
  try {
    const r = await fetch("/api/auth?action=status");
    if (!r.ok) return { ownerSet: false, authed: false };
    return (await r.json()) as AuthStatus;
  } catch {
    return { ownerSet: false, authed: false };
  }
}

/** Enroll the first passkey using the one-time setup code. Returns a recovery code. */
export async function setupPasskey(setupCode: string): Promise<{ recoveryCode?: string; error?: string }> {
  try {
    const optRes = await post("register-options", { setupCode });
    const opt = await optRes.json();
    if (!optRes.ok) return { error: opt.error || "Couldn't start setup." };

    const attestation = await startRegistration({ optionsJSON: opt });

    const verRes = await post("register-verify", { setupCode, response: attestation });
    const ver = await verRes.json();
    if (!verRes.ok) return { error: ver.error || "Couldn't finish setup." };
    return { recoveryCode: ver.recoveryCode };
  } catch (e) {
    return { error: humanError(e) };
  }
}

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

/** Use a recovery code to clear the lost passkey, then enroll a fresh one. */
export async function recover(recoveryCode: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    const r = await post("recover", { recoveryCode });
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
