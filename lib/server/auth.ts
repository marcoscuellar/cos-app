import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// Stateless session tokens: a base64url JSON payload signed with HMAC-SHA256
// using AUTH_SECRET. Lets admin endpoints verify the caller server-side without
// trusting client claims. (Self-contained — no external JWT dependency.)

const SECRET = process.env.AUTH_SECRET || "";

export function authConfigured(): boolean {
  return SECRET.length >= 16;
}

export interface TokenPayload {
  sub: string; // email
  role: "admin" | "user";
  name?: string;
  exp: number; // unix seconds
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function signToken(
  data: { sub: string; role: "admin" | "user"; name?: string },
  ttlSec = 7 * 24 * 3600,
): string {
  const payload: TokenPayload = { ...data, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string | null | undefined): TokenPayload | null {
  if (!token || !SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = b64url(createHmac("sha256", SECRET).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (!data.exp || Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function bearer(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const h = req.headers["authorization"] ?? req.headers["Authorization"];
  const val = Array.isArray(h) ? h[0] : h;
  return typeof val === "string" && val.startsWith("Bearer ") ? val.slice(7) : null;
}

export function adminEmail(): string {
  return (process.env.APP_ADMIN_EMAIL || "").trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  const a = adminEmail();
  return a !== "" && email.trim().toLowerCase() === a;
}

export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}
