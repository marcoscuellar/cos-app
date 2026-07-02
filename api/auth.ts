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
import {
  kvGet, kvGetRaw, kvSet, kvDel,
  kvSAdd, kvSRem, kvSIsMember, kvSCard, kvSMembers, kvMGet,
} from "../lib/server/kv.js";
import {
  getSecret, signSession, setSessionCookie, clearSessionCookie, readCookie,
  requireUser, SESSION_TTL_MS, OWNER_UID,
} from "../lib/server/session.js";
import { ensureOwnerMigrated } from "../lib/server/migrate.js";

// ─────────────────────────────────────────────────────────────────────────────
// Private accounts — passkey auth (WebAuthn), one signed session cookie per user.
//
// • register: needs a valid invite from the KV set `ollin:invites` (consumed on
//   use). The single owner may also (re-)enroll with the setup code, and any
//   signed-in user may add another device's passkey.
// • login: discoverable passkeys — the authenticator offers the right credential;
//   we map it back to a user id via the `cred:<id>` index.
// • sessions: HMAC-signed httpOnly cookie carrying the user id, 30 days.
// • owner-only: mint invite codes and read AGGREGATE stats (counts only), both
//   gated by the setup-code hash. Never returns any user's content.
// • migration: the pre-multiuser owner (`cos-auth:owner` + `*:me` keys) is moved
//   into `user:me:*` automatically and idempotently on first touch.
// ─────────────────────────────────────────────────────────────────────────────

// sha256 of the one-time owner setup / recovery code, delivered out-of-band.
const SETUP_CODE_HASH = "fdb2da9675f1b906cff67d216d88585d9772467f2eb4c911750b557651837803";

const INVITES_KEY = "ollin:invites";
const USERS_KEY = "ollin:users";
const CODEFAIL_KEY = "ollin:codefail"; // throttles online guessing of the setup code
const CODE_MAX_FAILS = 15;
const CODE_FAIL_TTL_SEC = 15 * 60;
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const REG_COOKIE = "cos_reg";
const LOGIN_COOKIE = "cos_login";
const credKey = (id: string) => `cred:${id}`;
const userCredsKey = (uid: string) => `user:${uid}:creds`;
const userMetaKey = (uid: string) => `user:${uid}:meta`;

interface StoredCredential {
  id: string; // base64url credential id
  publicKey: string; // base64url COSE public key
  counter: number;
  transports?: string[];
}
interface UserMeta { createdAt: number; lastActive: number }
interface PendingReg { uid: string; invite: string | null; challenge: string }
interface PendingLogin { challenge: string }

const b64url = (b: Buffer | Uint8Array) => Buffer.from(b).toString("base64url");
const fromB64url = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));
const sha256hex = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const newUid = () => crypto.randomBytes(16).toString("hex");
const nonce = () => crypto.randomBytes(18).toString("base64url");

// Readable invite / not easily confused (no O/0, I/1).
const INV_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeInvite(): string {
  const grp = () => Array.from({ length: 4 }, () => INV_ALPHA[crypto.randomInt(INV_ALPHA.length)]).join("");
  return `OLLIN-${grp()}-${grp()}`;
}

function shortCookie(res: VercelResponse, name: string, value: string, maxAgeSec: number, secure: boolean) {
  const attrs = [`${name}=${value}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${maxAgeSec}`];
  if (secure) attrs.push("Secure");
  // Preserve any session cookie already queued on this response.
  const prev = res.getHeader("Set-Cookie");
  const all = Array.isArray(prev) ? [...prev, attrs.join("; ")] : prev ? [String(prev), attrs.join("; ")] : attrs.join("; ");
  res.setHeader("Set-Cookie", all);
}

// rpID = registrable domain; origin = page origin. Derived per-request so the same
// code works on our own hosts + previews. rpID/origin are pinned to an ALLOWLIST
// rather than trusted from the Host/Origin headers, so a spoofed Host can't make
// us verify assertions for a foreign relying party.
const RP_CANONICAL = process.env.RP_ID || "costhread.app";
const RP_ALLOW = [/^localhost$/, /^costhread\.app$/, /(^|\.)vercel\.app$/];
function relyingParty(req: VercelRequest): { rpID: string; origin: string; secure: boolean } {
  const rawHost = (req.headers.host || "").split(":")[0];
  const allowed = RP_ALLOW.some((re) => re.test(rawHost));
  const rpID = allowed ? rawHost : RP_CANONICAL;
  const secure = rpID !== "localhost";
  // Build the origin from the validated host (with its port) — never the raw header.
  const origin = allowed ? `${secure ? "https" : "http"}://${req.headers.host}` : `https://${RP_CANONICAL}`;
  return { rpID, origin, secure };
}

async function touchActive(uid: string): Promise<void> {
  const meta = (await kvGet<UserMeta>(userMetaKey(uid))) ?? { createdAt: Date.now(), lastActive: 0 };
  meta.lastActive = Date.now();
  await kvSet(userMetaKey(uid), meta);
}

// Verify the owner setup code, throttled: too many wrong tries locks the
// setup-code actions for a window, so the code can't be guessed online.
async function checkOwnerCode(req: VercelRequest): Promise<"ok" | "bad" | "locked"> {
  const fails = (await kvGet<number>(CODEFAIL_KEY)) ?? 0;
  if (fails >= CODE_MAX_FAILS) return "locked";
  if (sha256hex(String(req.body?.code ?? "").trim().toUpperCase()) === SETUP_CODE_HASH) {
    await kvDel(CODEFAIL_KEY);
    return "ok";
  }
  await kvSet(CODEFAIL_KEY, fails + 1, { ttlSec: CODE_FAIL_TTL_SEC });
  return "bad";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || (req.body && req.body.action) || "status";
  const { rpID, origin, secure } = relyingParty(req);

  try {
    await ensureOwnerMigrated();

    // ── status: is this session signed in? ──
    if (action === "status") {
      return res.status(200).json({ authed: (await requireUser(req)) !== null });
    }

    // ── logout ──
    if (action === "logout") {
      clearSessionCookie(res, secure);
      return res.status(200).json({ ok: true });
    }

    // ── owner: mint an invite code (gated by the throttled setup code) ──
    if (action === "invite-create") {
      const g = await checkOwnerCode(req);
      if (g === "locked") return res.status(429).json({ error: "Too many attempts — try again later." });
      if (g !== "ok") return res.status(403).json({ error: "Not authorized." });
      const invite = makeInvite();
      await kvSAdd(INVITES_KEY, invite);
      return res.status(200).json({ invite });
    }

    // ── owner: aggregate stats only — never any content ──
    if (action === "stats") {
      const g = await checkOwnerCode(req);
      if (g === "locked") return res.status(429).json({ error: "Too many attempts — try again later." });
      if (g !== "ok") return res.status(403).json({ error: "Not authorized." });
      const uids = await kvSMembers(USERS_KEY);
      const metas = uids.length ? await kvMGet(uids.map(userMetaKey)) : [];
      const now = Date.now();
      let active = 0;
      for (const raw of metas) {
        if (!raw) continue;
        try { if (now - (JSON.parse(raw) as UserMeta).lastActive < ACTIVE_WINDOW_MS) active++; } catch { /* skip */ }
      }
      return res.status(200).json({ users: await kvSCard(USERS_KEY), active, invitesOutstanding: await kvSCard(INVITES_KEY) });
    }

    // ── begin registration ──
    if (action === "register-options") {
      // Identity precedence: signed-in (add a device) → valid invite → owner setup
      // code. Invite is checked BEFORE the code so normal sign-ups never touch the
      // setup-code fail counter (which would let anyone lock the owner out).
      const sessionUid = await requireUser(req);
      const invite = String(req.body?.invite ?? "").trim().toUpperCase();
      let uid: string;
      let inviteToConsume: string | null = null;

      if (sessionUid) {
        uid = sessionUid;
      } else if (invite && (await kvSIsMember(INVITES_KEY, invite))) {
        uid = newUid();
        inviteToConsume = invite;
      } else {
        const g = await checkOwnerCode(req);
        if (g === "locked") return res.status(429).json({ error: "Too many attempts — try again later." });
        if (g !== "ok") return res.status(403).json({ error: "You need a valid invite code to create an account." });
        uid = OWNER_UID;
      }

      const existing = (await kvGet<StoredCredential[]>(userCredsKey(uid))) ?? [];
      const options = await generateRegistrationOptions({
        rpName: "Ōllin",
        rpID,
        userName: uid === OWNER_UID ? "owner" : `member-${uid.slice(0, 6)}`,
        userID: new TextEncoder().encode(uid),
        attestationType: "none",
        authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
        excludeCredentials: existing.map((c) => ({ id: c.id })),
      });

      const n = nonce();
      await kvSet(`reg:${n}`, { uid, invite: inviteToConsume, challenge: options.challenge } as PendingReg, { ttlSec: 300 });
      shortCookie(res, REG_COOKIE, n, 300, secure);
      return res.status(200).json(options);
    }

    // ── finish registration ──
    if (action === "register-verify") {
      const n = readCookie(req, REG_COOKIE);
      const pending = n ? await kvGet<PendingReg>(`reg:${n}`) : null;
      if (!pending) return res.status(400).json({ error: "Setup expired — start again." });

      const response = req.body?.response as RegistrationResponseJSON;
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: pending.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "Couldn't register that passkey." });
      }

      const c = verification.registrationInfo.credential;
      // Never repoint another account's credential index. attestation is "none",
      // so a malicious authenticator could present a chosen id; refuse if it's
      // already claimed by a different user.
      const claimedBy = await kvGet<string>(credKey(c.id));
      if (claimedBy && claimedBy !== pending.uid) {
        return res.status(409).json({ error: "That passkey is already registered to an account." });
      }

      // Consume the invite ONLY now, atomically — SREM returns 0 if already used.
      if (pending.invite) {
        const removed = await kvSRem(INVITES_KEY, pending.invite);
        if (removed === 0) return res.status(409).json({ error: "That invite was already used." });
      }

      try {
        const cred: StoredCredential = {
          id: c.id,
          publicKey: b64url(c.publicKey),
          counter: c.counter,
          transports: response.response.transports,
        };
        const creds = (await kvGet<StoredCredential[]>(userCredsKey(pending.uid))) ?? [];
        await kvSet(userCredsKey(pending.uid), [...creds.filter((x) => x.id !== cred.id), cred]);
        await kvSet(credKey(cred.id), pending.uid);
        if (!(await kvGetRaw(userMetaKey(pending.uid)))) {
          await kvSet(userMetaKey(pending.uid), { createdAt: Date.now(), lastActive: Date.now() } as UserMeta);
        } else {
          await touchActive(pending.uid);
        }
        await kvSAdd(USERS_KEY, pending.uid);
      } catch (persistErr) {
        // A mid-write failure must not burn the invite — put it back so the user can retry.
        if (pending.invite) await kvSAdd(INVITES_KEY, pending.invite);
        throw persistErr;
      }
      await kvDel(`reg:${n}`);

      setSessionCookie(res, signSession(await getSecret(), pending.uid, Date.now() + SESSION_TTL_MS), secure);
      return res.status(200).json({ ok: true });
    }

    // ── begin authentication (discoverable — no allowCredentials) ──
    if (action === "login-options") {
      const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred", allowCredentials: [] });
      const n = nonce();
      await kvSet(`login:${n}`, { challenge: options.challenge } as PendingLogin, { ttlSec: 300 });
      shortCookie(res, LOGIN_COOKIE, n, 300, secure);
      return res.status(200).json(options);
    }

    // ── finish authentication ──
    if (action === "login-verify") {
      const n = readCookie(req, LOGIN_COOKIE);
      const pending = n ? await kvGet<PendingLogin>(`login:${n}`) : null;
      if (!pending) return res.status(400).json({ error: "Login expired — try again." });

      const response = req.body?.response as AuthenticationResponseJSON;
      const credId = String(response?.id ?? "");
      const uid = credId ? await kvGet<string>(credKey(credId)) : null;
      if (!uid) return res.status(401).json({ error: "That passkey isn't registered." });

      const creds = (await kvGet<StoredCredential[]>(userCredsKey(uid))) ?? [];
      const cred = creds.find((x) => x.id === credId);
      if (!cred) return res.status(401).json({ error: "That passkey isn't registered." });

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: pending.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
        credential: {
          id: cred.id,
          publicKey: fromB64url(cred.publicKey),
          counter: cred.counter,
          transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
        },
      });
      if (!verification.verified) return res.status(401).json({ error: "Passkey didn't verify." });
      await kvDel(`login:${n}`);

      cred.counter = verification.authenticationInfo.newCounter;
      await kvSet(userCredsKey(uid), creds);
      await touchActive(uid);

      setSessionCookie(res, signSession(await getSecret(), uid, Date.now() + SESSION_TTL_MS), secure);
      return res.status(200).json({ ok: true });
    }

    // ── owner break-glass: setup code clears the owner's passkeys to re-enroll ──
    if (action === "recover") {
      const g = await checkOwnerCode(req);
      if (g === "locked") return res.status(429).json({ error: "Too many attempts — try again later." });
      if (g !== "ok") return res.status(403).json({ error: "That setup code isn't right." });
      const creds = (await kvGet<StoredCredential[]>(userCredsKey(OWNER_UID))) ?? [];
      for (const c of creds) await kvDel(credKey(c.id));
      await kvDel(userCredsKey(OWNER_UID));
      return res.status(200).json({ ok: true }); // owner re-enrolls with the same setup code
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (error) {
    console.error("api/auth failure", error);
    return res.status(500).json({ error: "Auth is unavailable right now." });
  }
}
