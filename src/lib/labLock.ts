// Biometric lock for the Lab room — WebAuthn (Touch ID / Face ID / platform passkey).
// Client-side: registers a platform credential once, then requires a biometric
// assertion to unlock. The unlock flag lives in sessionStorage, so the Lab
// re-locks when the browser session ends.

const CRED_KEY = "cos.lab.cred"; // base64url credential id (persists across sessions)
const UNLOCK_KEY = "cos.lab.unlocked"; // per-session unlock flag

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuf(s: string): ArrayBuffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const buf = new ArrayBuffer(bin.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return buf;
}

function rand(n: number): ArrayBuffer {
  const buf = new ArrayBuffer(n);
  crypto.getRandomValues(new Uint8Array(buf));
  return buf;
}

export function isSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export function isRegistered(): boolean {
  try { return !!localStorage.getItem(CRED_KEY); } catch { return false; }
}

export function isUnlocked(): boolean {
  try { return sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
}

export function lock(): void {
  try { sessionStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
}

export function reset(): void {
  try { localStorage.removeItem(CRED_KEY); sessionStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
}

// First-time setup — create a platform passkey bound to this device's biometrics.
export async function register(): Promise<boolean> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: rand(32),
      rp: { name: "COS — Lab", id: location.hostname },
      user: { id: rand(16), name: "lab", displayName: "Lab" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!cred) return false;
  localStorage.setItem(CRED_KEY, bufToB64url(cred.rawId));
  sessionStorage.setItem(UNLOCK_KEY, "1");
  return true;
}

// Unlock — require a biometric assertion against the registered credential.
export async function unlock(): Promise<boolean> {
  const id = localStorage.getItem(CRED_KEY);
  if (!id) return false;
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      allowCredentials: [{ type: "public-key", id: b64urlToBuf(id) }],
      userVerification: "required",
      timeout: 60000,
      rpId: location.hostname,
    },
  });
  if (!assertion) return false;
  sessionStorage.setItem(UNLOCK_KEY, "1");
  return true;
}
