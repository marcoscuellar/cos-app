// COS access gate — a free, edge-enforced password wall.
//
// Runs at Vercel's edge before any page, asset, or /api function is served, so
// the whole app (including the Anthropic key behind /api/ask) sits behind one
// shared password. No UI to build: the browser shows its native prompt.
//
// The password lives in the APP_PASSWORD env var (Vercel → Settings → Env Vars,
// Production, Sensitive). FAILSAFE: if APP_PASSWORD is unset, the gate stays
// open — so we can never accidentally lock ourselves out before configuring it.
//
// Swappable later: when COS goes multi-user, this single-password wall is
// replaced by the per-user auth system already in the git history.

export const config = {
  // Gate every path. The browser caches the credential after the first prompt
  // and attaches it to all later requests (assets + same-origin /api fetches).
  matcher: "/:path*",
};

export default function middleware(req: Request): Response | undefined {
  // Reuse the password you already configured (APP_ADMIN_PASSWORD). Set a
  // dedicated APP_PASSWORD to override it without touching the auth system.
  const password = process.env.APP_PASSWORD || process.env.APP_ADMIN_PASSWORD;
  if (!password) return; // not configured yet → leave the site open

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6)); // "user:pass"
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (supplied === password) return; // authorized → continue to the app
    } catch {
      /* malformed header — fall through to the challenge */
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="COS", charset="UTF-8"' },
  });
}
