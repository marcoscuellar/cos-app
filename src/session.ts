// ─────────────────────────────────────────────────────────────────────────────
// Session mode — authenticated private account (the default) vs. an explicit,
// read-only public DEMO.
//
// Private accounts are now the norm: opening /app with no auth shows the
// login/register screen (see AppLock), and every account's rooms are isolated
// server-side. The fictional DEMO_DATA workspace is only shown when a visitor
// explicitly asks for it — `?demo=1` (marketing "try the demo") or the /demo path
// — so nobody's real data is ever involved.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_KEY = "cos-demo"; // sticky "this tab is exploring the demo" flag
export const OWNER_KEY = "cos-owner"; // retained for back-compat with older UI bits

function computeDemo(): boolean {
  if (typeof window === "undefined") return false; // SSR: assume the real app
  try {
    const { search, pathname } = window.location;
    const params = new URLSearchParams(search);
    const demo = params.get("demo");
    if (demo === "1") {
      try { sessionStorage.setItem(DEMO_KEY, "1"); } catch { /* ignore */ }
      return true;
    }
    if (demo === "0") {
      try { sessionStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
      return false;
    }
    if (pathname === "/demo" || pathname.startsWith("/demo/")) return true;
    try { if (sessionStorage.getItem(DEMO_KEY) === "1") return true; } catch { /* ignore */ }
    return false;
  } catch {
    return false;
  }
}

/** True only for the explicit, read-only public demo. Otherwise the real, per-user account. */
export const IS_DEMO = computeDemo();
