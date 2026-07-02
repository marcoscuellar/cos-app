import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { kvGet, kvSet } from "./kv.js";

// ─────────────────────────────────────────────────────────────────────────────
// Session — one signed, HTTP-only cookie that carries the authenticated USER ID.
//
// This is the single source of truth for "who is calling". Every data endpoint
// derives the user id from here (never from the request body or URL), so no user
// can ever read or write another user's namespace. The cookie is an HMAC over
// { sub: <uid>, exp } — unforgeable without the server secret, which lives in KV.
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "cos_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SECRET_KEY = "cos-auth:secret";

// The pre-multiuser owner used sub:"owner"; their data now lives under uid "me".
// Bridge any still-valid legacy owner cookie so the owner never gets logged out.
export const OWNER_UID = "me";
const LEGACY_OWNER_SUB = "owner";

export async function getSecret(): Promise<string> {
  const s = await kvGet<string>(SECRET_KEY);
  if (s && typeof s === "string") return s;
  // First boot: SET NX so concurrent cold starts converge on ONE secret (last
  // write can't clobber), then read back whichever value actually landed.
  const candidate = crypto.randomBytes(32).toString("hex");
  await kvSet(SECRET_KEY, candidate, { nx: true });
  const winner = await kvGet<string>(SECRET_KEY);
  return typeof winner === "string" && winner ? winner : candidate;
}

export function signSession(secret: string, uid: string, exp: number): string {
  const body = Buffer.from(JSON.stringify({ sub: uid, exp })).toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** Verify an HMAC session token and return the user id (or null if invalid/expired). */
export function verifySession(token: string, secret: string): string | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { sub?: string; exp?: number };
    if (typeof p.exp !== "number" || p.exp <= Date.now()) return null;
    if (typeof p.sub !== "string" || !p.sub) return null;
    return p.sub === LEGACY_OWNER_SUB ? OWNER_UID : p.sub;
  } catch {
    return null;
  }
}

export function readCookie(req: VercelRequest, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/**
 * The authenticated user id for this request, or null. THIS is the only source of
 * identity a data endpoint may trust — never the body or the URL.
 */
export async function requireUser(req: VercelRequest): Promise<string | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  return verifySession(token, await getSecret());
}

function cookieAttrs(value: string, maxAgeSec: number, secure: boolean): string {
  const attrs = [`${SESSION_COOKIE}=${value}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${maxAgeSec}`];
  if (secure) attrs.push("Secure");
  return attrs.join("; ");
}

export function setSessionCookie(res: VercelResponse, token: string, secure: boolean): void {
  res.setHeader("Set-Cookie", cookieAttrs(encodeURIComponent(token), Math.floor(SESSION_TTL_MS / 1000), secure));
}

export function clearSessionCookie(res: VercelResponse, secure: boolean): void {
  res.setHeader("Set-Cookie", cookieAttrs("", 0, secure));
}

/** 401 helper — returns true and writes the response when the caller is unauthenticated. */
export function unauthorized(res: VercelResponse): true {
  res.status(401).json({ error: "Sign in to continue." });
  return true;
}
