import { useState, type ReactNode } from "react";
import * as lock from "../lib/appLock";

// Full-screen biometric gate for the whole app. Renders the children only once
// the device biometric check passes for this browser session.
export function AppLock({ children }: { children: ReactNode }) {
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
    <div className="app-lock">
      <div className="app-lock-inner">
        <div className="al-mark"><span className="cos-logo">COS</span></div>

        <div className="al-fp" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 11v3a8 8 0 0 1-.4 2.5" />
            <path d="M8.4 6.6a5 5 0 0 1 7.6 4.3v2a13 13 0 0 1-.3 2.8" />
            <path d="M5.5 10.9a6.5 6.5 0 0 1 1.2-3.8" />
            <path d="M6 16.5a10 10 0 0 0 .6-5.6 5.4 5.4 0 0 1 8.9-3.8" />
            <path d="M9 18.7a13 13 0 0 0 .9-7.8 2.1 2.1 0 0 1 4.1.9v2.2" />
            <path d="M18.5 11.5a8 8 0 0 0-3.2-6.4" />
          </svg>
        </div>

        <h1 className="al-title">Locked.</h1>
        <div className="al-sub">
          {!supported
            ? "This device doesn't support Touch ID or passkeys. Open COS in Safari or Chrome on a device with biometrics."
            : registered
              ? "Unlock with Touch ID to enter."
              : "Set up Touch ID once to lock COS to this device."}
        </div>

        {supported && (
          registered ? (
            <button className="al-btn" onClick={() => run(lock.unlock, "Unlock was cancelled.")} disabled={busy}>
              {busy ? "Waiting for Touch ID…" : "Unlock with Touch ID"}
            </button>
          ) : (
            <button className="al-btn" onClick={() => run(lock.register, "Setup was cancelled.")} disabled={busy}>
              {busy ? "Setting up…" : "Set up Touch ID"}
            </button>
          )
        )}

        {err && <div className="al-err">{err}</div>}
      </div>
    </div>
  );
}
