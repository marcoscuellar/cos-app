import bcrypt from "bcryptjs";
import { kvGet, kvSet, kvDel, kvSAdd, kvSMembers, kvMGet } from "./kv";
import { isAdminEmail } from "./auth";

export interface UserRecord {
  name: string;
  email: string;
  password: string; // bcrypt hash
  role: "admin" | "user";
  createdAt: number;
  active: boolean;
  lastLogin: number | null;
}

export interface PublicUser {
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: number;
  active: boolean;
  lastLogin: number | null;
}

const USERS_INDEX = "users:index";
const userKey = (email: string) => `users:${email.trim().toLowerCase()}`;

export async function getUser(email: string): Promise<UserRecord | null> {
  return kvGet<UserRecord>(userKey(email));
}

export async function saveUser(user: UserRecord): Promise<void> {
  await kvSet(userKey(user.email), user);
  await kvSAdd(USERS_INDEX, user.email.trim().toLowerCase());
}

export async function listUsers(): Promise<UserRecord[]> {
  const emails = await kvSMembers(USERS_INDEX);
  if (!emails.length) return [];
  const raws = await kvMGet(emails.map(userKey));
  const users: UserRecord[] = [];
  for (const raw of raws) {
    if (!raw) continue;
    try {
      users.push(JSON.parse(raw) as UserRecord);
    } catch {
      /* skip malformed */
    }
  }
  users.sort((a, b) => a.createdAt - b.createdAt);
  return users;
}

export async function setActive(email: string, active: boolean): Promise<UserRecord | null> {
  const u = await getUser(email);
  if (!u) return null;
  u.active = active;
  await saveUser(u);
  return u;
}

export async function touchLastLogin(email: string): Promise<void> {
  const u = await getUser(email);
  if (u) {
    u.lastLogin = Date.now();
    await saveUser(u);
  }
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function roleFor(email: string): "admin" | "user" {
  return isAdminEmail(email) ? "admin" : "user";
}

export function publicUser(u: UserRecord): PublicUser {
  return {
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    active: u.active,
    lastLogin: u.lastLogin,
  };
}

// ---------------- invites ----------------
export interface InviteRecord {
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: number;
  expiresAt: number;
}

const inviteKey = (token: string) => `invite:${token}`;
export const INVITE_TTL_SEC = 24 * 3600; // 24 hours

export async function createInvite(token: string, rec: InviteRecord): Promise<void> {
  await kvSet(inviteKey(token), rec, { ttlSec: INVITE_TTL_SEC });
}

export async function getInvite(token: string): Promise<InviteRecord | null> {
  const rec = await kvGet<InviteRecord>(inviteKey(token));
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    await kvDel(inviteKey(token));
    return null;
  }
  return rec;
}

export async function deleteInvite(token: string): Promise<void> {
  await kvDel(inviteKey(token));
}
