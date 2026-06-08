import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getInvite, deleteInvite, getUser, saveUser, hashPassword, roleFor } from "../lib/server/users.js";
import { signToken, authConfigured } from "../lib/server/auth.js";

// Invite acceptance. GET validates a token (for the setup page); POST creates
// the account (bcrypt-hashed password) and consumes the one-time invite.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) return res.status(400).json({ ok: false, error: "Missing token." });
    try {
      const inv = await getInvite(token);
      if (!inv) return res.status(404).json({ ok: false, error: "This invite link is invalid or has expired." });
      return res.status(200).json({ ok: true, email: inv.email, name: inv.name, role: inv.role, expiresAt: inv.expiresAt });
    } catch {
      return res.status(502).json({ ok: false, error: "Something went wrong." });
    }
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as { token?: string; name?: string; password?: string };
    const token = (body.token || "").trim();
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) return res.status(400).json({ ok: false, error: "Missing token." });
    if (password.length < 8) return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });

    try {
      const inv = await getInvite(token);
      if (!inv) return res.status(404).json({ ok: false, error: "This invite link is invalid or has expired." });
      const existing = await getUser(inv.email);
      if (existing && existing.active) {
        await deleteInvite(token);
        return res.status(409).json({ ok: false, error: "This account already exists. Try signing in." });
      }
      const name = (body.name || inv.name || inv.email.split("@")[0]).trim();
      // Honor the admin env even if the invite said "user".
      const role: "admin" | "user" = roleFor(inv.email) === "admin" ? "admin" : inv.role;
      const now = Date.now();
      const user = {
        name,
        email: inv.email,
        password: await hashPassword(password),
        role,
        createdAt: now,
        active: true,
        lastLogin: now,
      };
      await saveUser(user);
      await deleteInvite(token);

      const authToken = authConfigured() ? signToken({ sub: user.email, role: user.role, name: user.name }) : null;
      return res.status(200).json({
        ok: true,
        token: authToken,
        user: { name: user.name, email: user.email, role: user.role, active: true, createdAt: now, lastLogin: now },
      });
    } catch {
      return res.status(502).json({ ok: false, error: "Something went wrong." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
