import { useState, type ReactNode } from "react";
import * as lock from "../lib/labLock";

// Gate that fronts the Lab room with a Touch ID / Face ID unlock. Renders the
// children only once the device biometric check passes for this session.
export function LabLock({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(lock.isUnlocked());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const supported = lock.isSupported();
  const registered = lock.isRegistered();

  const run = async (fn: () => Promise<boolean>, cancelMsg: string) => {
    setBusy(true);
    setErr(null);
    try {
      if (await fn()) setUnlocked(true);
      else setErr(cancelMsg);
    } catch {
      setErr("Touch ID didn't go through. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap room-arch">
      <div className="stagger">
        <div className="foyer">
          <div className="foyer-mark"><span className="mono-meta">Let's build shit</span></div>
        </div>

        <div className="lab-lock">
          <div className="ll-fp" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 11v3a8 8 0 0 1-.4 2.5" />
              <path d="M8.4 6.6a5 5 0 0 1 7.6 4.3v2a13 13 0 0 1-.3 2.8" />
              <path d="M5.5 10.9a6.5 6.5 0 0 1 1.2-3.8" />
              <path d="M6 16.5a10 10 0 0 0 .6-5.6 5.4 5.4 0 0 1 8.9-3.8" />
              <path d="M9 18.7a13 13 0 0 0 .9-7.8 2.1 2.1 0 0 1 4.1.9v2.2" />
              <path d="M18.5 11.5a8 8 0 0 0-3.2-6.4" />
            </svg>
          </div>

          <div className="ll-title">The Lab is locked.</div>
          <div className="ll-sub">
            {!supported
              ? "This device doesn't support Touch ID or passkeys."
              : registered
                ? "Unlock with Touch ID to reach the engines."
                : "Set up Touch ID once to keep the engines private."}
          </div>

          {supported && (
            registered ? (
              <button className="ll-btn" onClick={() => run(lock.unlock, "Unlock was cancelled.")} disabled={busy}>
                {busy ? "Waiting for Touch ID…" : "Unlock with Touch ID"}
              </button>
            ) : (
              <button className="ll-btn" onClick={() => run(lock.register, "Setup was cancelled.")} disabled={busy}>
                {busy ? "Setting up…" : "Set up Touch ID"}
              </button>
            )
          )}

          {err && <div className="ll-err">{err}</div>}
        </div>
      </div>
    </div>
  );
}
