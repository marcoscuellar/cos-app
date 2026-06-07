import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kvGetRaw, kvSet } from "../lib/server/kv";
import {
  getUser,
  saveUser,
  touchLastLogin,
  verifyPassword,
  hashPassword,
  roleFor,
  publicUser,
} from "../lib/server/users";
import { signToken, authConfigured, adminEmail } from "../lib/server/auth";

// Login is KV-backed: it looks up the users:{email} record and verifies the
// bcrypt password. Two special cases: a time-limited test account, and a
// one-time admin bootstrap seeded from env (APP_ADMIN_EMAIL/APP_ADMIN_PASSWORD).

const TEST_EMAIL = "test@costhread.app";
const TEST_PASSWORD = process.env.TEST_LOGIN_PASSWORD || "costhread2026";
const TEST_WINDOW_MS = 48 * 60 * 60 * 1000;
const TEST_FIRST_USE_KEY = "login:test@costhread.app:first-use";

function norm(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Read-only test-session status probe (re-validates a restored test session).
  if (req.method === "GET") {
    const email = norm(req.query.email);
    if (email !== TEST_EMAIL) return res.status(200).json({ ok: true, expired: false });
    try {
      const stored = await kvGetRaw(TEST_FIRST_USE_KEY);
      const firstUse = stored != null ? Number(stored) : null;
      const expired = firstUse != null && Date.now() >= firstUse + TEST_WINDOW_MS;
      return res.status(200).json({ ok: !expired, expired });
    } catch {
      return res.status(502).json({ error: "Storage unavailable." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = (req.body ?? {}) as { email?: string; password?: string };
  const email = norm(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email) return res.status(400).json({ ok: false, error: "Enter your email." });

  // 1) Time-limited test account (48h after first use).
  if (email === TEST_EMAIL) {
    if (password !== TEST_PASSWORD) {
      return res.status(401).json({ ok: false, error: "Incorrect email or password." });
    }
    try {
      const now = Date.now();
      await kvSet(TEST_FIRST_USE_KEY, String(now), { nx: true });
      const stored = await kvGetRaw(TEST_FIRST_USE_KEY);
      const firstUse = Number(stored) || now;
      if (now >= firstUse + TEST_WINDOW_MS) {
        return res.status(403).json({
          ok: false,
          expired: true,
          error: "This test login has expired — it was valid for 48 hours after first use.",
        });
      }
      return res
        .status(200)
        .json({ ok: true, user: { name: "Test User", email: TEST_EMAIL, role: "user", active: true, createdAt: 0, lastLogin: null } });
    } catch {
      return res.status(502).json({ ok: false, error: "Login is temporarily unavailable." });
    }
  }

  // 2) Real users from KV.
  try {
    let user = await getUser(email);

    // Bootstrap: seed the admin account from env on first login.
    if (!user && email === adminEmail()) {
      const seedPw = process.env.APP_ADMIN_PASSWORD || "";
      if (!seedPw) return res.status(403).json({ ok: false, error: "Admin account is not set up yet." });
      if (password !== seedPw) return res.status(401).json({ ok: false, error: "Incorrect email or password." });
      user = {
        name: "Admin",
        email,
        password: await hashPassword(seedPw),
        role: "admin",
        createdAt: Date.now(),
        active: true,
        lastLogin: null,
      };
      await saveUser(user);
    }

    if (!user) return res.status(401).json({ ok: false, error: "Incorrect email or password." });
    if (!user.active) return res.status(403).json({ ok: false, error: "This account has been deactivated." });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ ok: false, error: "Incorrect email or password." });

    // Keep the stored role in sync with APP_ADMIN_EMAIL.
    const role = roleFor(email);
    if (user.role !== role) {
      user.role = role;
      await saveUser(user);
    }

    await touchLastLogin(email);

    const token = authConfigured() ? signToken({ sub: email, role, name: user.name }) : null;
    return res.status(200).json({ ok: true, token, user: publicUser({ ...user, lastLogin: Date.now() }) });
  } catch {
    return res.status(502).json({ ok: false, error: "Login is temporarily unavailable." });
  }
}
