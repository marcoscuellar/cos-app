// ─────────────────────────────────────────────────────────────────────────────
// Session mode — public demo (the default) vs. the real private account.
//
// costhread.app is a PUBLIC link, so the default experience is the read-only
// DEMO: a fictional, fully-populated workspace (see data.demo.ts) that anyone
// can explore without touching real data or triggering AI/storage writes.
//
// The real account is opt-in and will sit behind the passkey lock (next step):
//   • ?me=1 in the URL   → enter the real account (sticky for the tab)
//   • a /me path         → same
//   • ?me=0              → leave the real account, back to the public demo
//
// Until the lock lands, ?me=1 is the (unguessable-enough, temporary) door to the
// real account — protecting it is the very next piece of work.
// ─────────────────────────────────────────────────────────────────────────────

const STICKY_KEY = "cos-real"; // sticky "this tab is in the real account" flag
export const OWNER_KEY = "cos-owner"; // durable "this browser belongs to the owner" flag

function computeDemo(): boolean {
  if (typeof window === "undefined") return true; // safe default: public demo
  try {
    const { search, pathname } = window.location;
    const params = new URLSearchParams(search);
    const real = params.get("me") ?? params.get("real");
    if (real === "1") {
      try { sessionStorage.setItem(STICKY_KEY, "1"); } catch { /* ignore */ }
      try { localStorage.setItem(OWNER_KEY, "1"); } catch { /* ignore */ } // durable: marks this browser as the owner's
      return false;
    }
    if (real === "0") {
      try { sessionStorage.removeItem(STICKY_KEY); } catch { /* ignore */ }
      try { localStorage.removeItem(OWNER_KEY); } catch { /* ignore */ }
      return true;
    }
    if (pathname === "/me" || pathname.startsWith("/me/")) return false;
    try { if (sessionStorage.getItem(STICKY_KEY) === "1") return false; } catch { /* ignore */ }
    return true; // default: public, read-only demo
  } catch {
    return true;
  }
}

/** True for the public, read-only demo (the default). False = the real account. */
export const IS_DEMO = computeDemo();
