import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, bearer, isAdminEmail } from "../lib/server/auth.js";
import { getUser, publicUser } from "../lib/server/users.js";

// Whoami — verifies the session token and returns the current user + admin flag.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }
  const payload = verifyToken(bearer(req));
  if (!payload) return res.status(401).json({ ok: false });
  try {
    const user = await getUser(payload.sub);
    if (!user || !user.active) return res.status(401).json({ ok: false });
    return res.status(200).json({ ok: true, user: publicUser(user), isAdmin: isAdminEmail(user.email) });
  } catch {
    // KV unavailable — fall back to the verified token identity so the app
    // isn't bricked (admin listing still requires KV and will surface its own error).
    return res.status(200).json({
      ok: true,
      user: { name: payload.name || payload.sub, email: payload.sub, role: payload.role, active: true, createdAt: 0, lastLogin: null },
      isAdmin: isAdminEmail(payload.sub),
    });
  }
}
