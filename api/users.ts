import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, bearer, isAdminEmail, newInviteToken } from "../lib/server/auth.js";
import { listUsers, setActive, getUser, createInvite, publicUser, INVITE_TTL_SEC } from "../lib/server/users.js";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Returns the admin's email if the caller is an authenticated admin, else null.
function requireAdmin(req: VercelRequest): string | null {
  const payload = verifyToken(bearer(req));
  if (!payload || !isAdminEmail(payload.sub)) return null;
  return payload.sub.trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = requireAdmin(req);
  if (!admin) return res.status(403).json({ ok: false, error: "Admin access required." });

  try {
    if (req.method === "GET") {
      const users = await listUsers();
      return res.status(200).json({ ok: true, users: users.map(publicUser) });
    }

    if (req.method === "POST") {
      const body = (req.body ?? {}) as { action?: string; email?: string; name?: string; role?: string; active?: boolean };

      if (body.action === "invite") {
        const email = (body.email || "").trim().toLowerCase();
        const name = (body.name || "").trim();
        const role: "admin" | "user" = body.role === "admin" ? "admin" : "user";
        if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: "Enter a valid email." });
        const existing = await getUser(email);
        if (existing) return res.status(409).json({ ok: false, error: "A user with that email already exists." });
        const token = newInviteToken();
        const now = Date.now();
        await createInvite(token, { email, name, role, createdAt: now, expiresAt: now + INVITE_TTL_SEC * 1000 });
        const origin = `https://${req.headers.host}`;
        return res.status(200).json({ ok: true, inviteLink: `${origin}/invite?token=${token}`, expiresAt: now + INVITE_TTL_SEC * 1000 });
      }

      if (body.action === "setActive") {
        const email = (body.email || "").trim().toLowerCase();
        if (email === admin && body.active === false) {
          return res.status(400).json({ ok: false, error: "You can't deactivate your own admin account." });
        }
        const u = await setActive(email, Boolean(body.active));
        if (!u) return res.status(404).json({ ok: false, error: "User not found." });
        return res.status(200).json({ ok: true, user: publicUser(u) });
      }

      return res.status(400).json({ ok: false, error: "Unknown action." });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch {
    return res.status(502).json({ ok: false, error: "Something went wrong." });
  }
}
