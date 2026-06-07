import type { User } from "./types";

// Client-side auth: holds the session token (localStorage) and talks to the
// /api auth endpoints. No secrets here — only the signed token the server issued.

const TOKEN_KEY = "cos-auth-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(t: string | null): void {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function logout(): void {
  setToken(null);
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export interface Session {
  user: User;
  isAdmin: boolean;
}

export interface LoginResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await r.json().catch(() => ({}))) as { ok?: boolean; user?: User; token?: string | null; error?: string };
  if (r.ok && data.ok && data.user) {
    if (data.token) setToken(data.token);
    return { ok: true, user: data.user };
  }
  return { ok: false, error: data.error || "Login failed." };
}

export async function whoami(): Promise<Session | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const r = await fetch("/api/auth", { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      setToken(null);
      return null;
    }
    const data = (await r.json()) as { ok?: boolean; user?: User; isAdmin?: boolean };
    if (!data.ok || !data.user) {
      setToken(null);
      return null;
    }
    return { user: data.user, isAdmin: Boolean(data.isAdmin) };
  } catch {
    return null;
  }
}
