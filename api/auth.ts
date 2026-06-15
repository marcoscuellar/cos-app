import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { kvGet, kvSet, kvDel } from "../lib/server/kv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Passkey lock for the real account (?me=1). Fingerprint / Face ID via WebAuthn,
// verified server-side; a signed httpOnly session cookie keeps you unlocked.
//
// The first passkey can only be claimed with a one-time SETUP CODE (so a stranger
// who finds the ?me=1 URL can't grab the account). A recovery code is issued once
// at setup so a lost device never means a permanent lockout. Everything lives in
// Vercel KV; no extra Vercel env config is required.
// ─────────────────────────────────────────────────────────────────────────────

// sha256 of the one-time setup code, delivered to the owner out-of-band (chat).
const SETUP_CODE_HASH = "7ed450cbc8df08f6c7ad38bc788a696b94b0bdd0e32513754c5fe95b602aeea3";

const OWNER_KEY = "cos-auth:owner";
const SECRET_KEY = "cos-auth:secret";
const CHALLENGE_KEY = "cos-auth:challenge";
const SESSION_COOKIE = "cos_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface StoredCredential {
  id: string; // base64url credential id
  publicKey: string; // base64url COSE public key
  counter: number;
  transports?: string[];
}
interface Owner {
  credential: StoredCredential;
  createdAt: number;
}

// ── small helpers ────────────────────────────────────────────────────────────
const b64url = (b: Buffer | Uint8Array) => Buffer.from(b).toString("base64url");
const fromB64url = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));
const sha256hex = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

async function getSecret(): Promise<string> {
  let s = await kvGet<string>(SECRET_KEY);
  if (!s || typeof s !== "string") {
    s = crypto.randomBytes(32).toString("hex");
    await kvSet(SECRET_KEY, s);
  }
  return s;
}

function signSession(secret: string, exp: number): string {
  const body = Buffer.from(JSON.stringify({ sub: "owner", exp })).toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verifySession(token: string, secret: string): boolean {
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { exp?: number };
    return typeof p.exp === "number" && p.exp > Date.now();
  } catch {
    return false;
  }
}

function readCookie(req: VercelRequest, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function setSessionCookie(res: VercelResponse, token: string, secure: boolean) {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) attrs.push("Secure");
  res.setHeader("Set-Cookie", attrs.join("; "));
}

function clearSessionCookie(res: VercelResponse, secure: boolean) {
  const attrs = [`${SESSION_COOKIE}=`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (secure) attrs.push("Secure");
  res.setHeader("Set-Cookie", attrs.join("; "));
}

// rpID = the registrable domain; origin = the page origin. Derived per-request so
// the same code works on costhread.app, preview URLs, and localhost.
function relyingParty(req: VercelRequest): { rpID: string; origin: string; secure: boolean } {
  const host = (req.headers.host || "localhost").split(":")[0];
  const originHeader = (req.headers.origin as string) || "";
  const origin = originHeader || `https://${req.headers.host || host}`;
  return { rpID: host, origin, secure: origin.startsWith("https://") };
}

async function authed(req: VercelRequest): Promise<boolean> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return false;
  return verifySession(token, await getSecret());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || (req.body && req.body.action) || "status";
  const { rpID, origin, secure } = relyingParty(req);

  try {
    const owner = await kvGet<Owner>(OWNER_KEY);

    // ── status: does an owner exist, and is this session unlocked? ──
    if (action === "status") {
      return res.status(200).json({ ownerSet: Boolean(owner), authed: await authed(req) });
    }

    // ── begin registration (first passkey, or re-enroll) ──
    if (action === "register-options") {
      if (owner) {
        // Re-enrolling requires an unlocked session.
        if (!(await authed(req))) return res.status(401).json({ error: "Unlock first to add a passkey." });
      } else {
        const code = String((req.body?.setupCode ?? "")).trim().toUpperCase();
        if (sha256hex(code) !== SETUP_CODE_HASH) {
          return res.status(403).json({ error: "That setup code isn't right." });
        }
      }
      const options = await generateRegistrationOptions({
        rpName: "COS",
        rpID,
        userName: "owner",
        userID: new TextEncoder().encode("cos-owner"),
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred", // prompts Touch ID / Face ID / Windows Hello
        },
        excludeCredentials: owner ? [{ id: owner.credential.id }] : [],
      });
      await kvSet(CHALLENGE_KEY, options.challenge, { ttlSec: 300 });
      return res.status(200).json(options);
    }

    // ── finish registration ──
    if (action === "register-verify") {
      const expectedChallenge = await kvGet<string>(CHALLENGE_KEY);
      if (!expectedChallenge) return res.status(400).json({ error: "Setup expired — start again." });
      if (owner && !(await authed(req))) return res.status(401).json({ error: "Unlock first." });
      if (!owner) {
        const code = String((req.body?.setupCode ?? "")).trim().toUpperCase();
        if (sha256hex(code) !== SETUP_CODE_HASH) return res.status(403).json({ error: "That setup code isn't right." });
      }

      const response = req.body?.response as RegistrationResponseJSON;
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "Couldn't register that passkey." });
      }
      await kvDel(CHALLENGE_KEY);

      const cred = verification.registrationInfo.credential;
      const next: Owner = {
        credential: {
          id: cred.id,
          publicKey: b64url(cred.publicKey),
          counter: cred.counter,
          transports: response.response.transports,
        },
        createdAt: owner?.createdAt ?? Date.now(),
      };
      await kvSet(OWNER_KEY, next);

      const token = signSession(await getSecret(), Date.now() + SESSION_TTL_MS);
      setSessionCookie(res, token, secure);
      return res.status(200).json({ ok: true });
    }

    // ── begin authentication ──
    if (action === "login-options") {
      if (!owner) return res.status(404).json({ error: "No passkey set up yet." });
      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        allowCredentials: [{
          id: owner.credential.id,
          transports: owner.credential.transports as AuthenticatorTransportFuture[] | undefined,
        }],
      });
      await kvSet(CHALLENGE_KEY, options.challenge, { ttlSec: 300 });
      return res.status(200).json(options);
    }

    // ── finish authentication ──
    if (action === "login-verify") {
      if (!owner) return res.status(404).json({ error: "No passkey set up yet." });
      const expectedChallenge = await kvGet<string>(CHALLENGE_KEY);
      if (!expectedChallenge) return res.status(400).json({ error: "Login expired — try again." });

      const response = req.body?.response as AuthenticationResponseJSON;
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
        credential: {
          id: owner.credential.id,
          publicKey: fromB64url(owner.credential.publicKey),
          counter: owner.credential.counter,
          transports: owner.credential.transports as AuthenticatorTransportFuture[] | undefined,
        },
      });
      if (!verification.verified) return res.status(401).json({ error: "Passkey didn't verify." });
      await kvDel(CHALLENGE_KEY);

      owner.credential.counter = verification.authenticationInfo.newCounter;
      await kvSet(OWNER_KEY, owner);

      const token = signSession(await getSecret(), Date.now() + SESSION_TTL_MS);
      setSessionCookie(res, token, secure);
      return res.status(200).json({ ok: true });
    }

    // ── break-glass: the setup code clears the passkey so you can re-enroll ──
    // (No code for the user to save day-to-day — passkeys sync via iCloud/Google;
    //  this is only the rare "lost every device" reset, using the one setup code.)
    if (action === "recover") {
      if (!owner) return res.status(404).json({ error: "Nothing to reset." });
      const code = String((req.body?.code ?? "")).trim().toUpperCase();
      if (sha256hex(code) !== SETUP_CODE_HASH) {
        return res.status(403).json({ error: "That setup code isn't right." });
      }
      await kvDel(OWNER_KEY);
      return res.status(200).json({ ok: true });
    }

    // ── logout ──
    if (action === "logout") {
      clearSessionCookie(res, secure);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (error) {
    console.error("api/auth failure", error);
    return res.status(500).json({ error: "Auth is unavailable right now." });
  }
}
