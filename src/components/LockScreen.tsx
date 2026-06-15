import { useState } from "react";
import { setupPasskey, loginPasskey, recover, type AuthStatus } from "../auth";

// The lock over the real account. Passkey-first (fingerprint / Face ID), with a
// one-time setup code for the very first enrollment and a recovery path if the
// device is ever lost. Demo never reaches here (AppLock lets it straight through).

const Finger = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 11a1 1 0 0 1 1 1c0 3-.5 4.5-1.2 5.8" />
    <path d="M8.5 13.5c.3 2-.2 3.6-1 4.8" />
    <path d="M15.5 13c-.2 2.2-.7 3.9-1.5 5.3" />
    <path d="M5.2 9.5a8 8 0 0 1 13.6 0" />
    <path d="M9 6.4a5 5 0 0 1 6 0" />
    <path d="M9.5 12a2.5 2.5 0 0 1 5 .2c0 1.6-.1 3-.6 4.4" />
  </svg>
);

type Mode = "unlock" | "setup" | "recover";

export function LockScreen({ status, onUnlocked }: { status: AuthStatus; onUnlocked: () => void }) {
  const [mode, setMode] = useState<Mode>(status.ownerSet ? "unlock" : "setup");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const unlock = async () => {
    setBusy(true); setErr(null);
    const r = await loginPasskey();
    setBusy(false);
    if (r.ok) onUnlocked(); else setErr(r.error ?? "Couldn't unlock.");
  };

  const doSetup = async () => {
    setBusy(true); setErr(null);
    const r = await setupPasskey(code.trim());
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    onUnlocked();
  };

  const doRecover = async () => {
    setBusy(true); setErr(null);
    const r = await recover(code.trim());
    setBusy(false);
    if (r.ok) { setCode(""); setMode("setup"); setErr(null); }
    else setErr(r.error ?? "Reset failed.");
  };

  return (
    <div className="lock-wrap">
      <div className="lock-card">
        <div className="lock-mark">COS</div>

        {mode === "unlock" && (
          <>
            <h1 className="lock-title">Welcome back.</h1>
            <p className="lock-sub">Unlock with your passkey — Touch ID, Face ID, or your device PIN.</p>
            <button className="lock-btn lock-btn--passkey" onClick={unlock} disabled={busy}>
              <Finger /> {busy ? "Waiting for you…" : "Unlock"}
            </button>
            <button className="lock-link" onClick={() => { setMode("recover"); setErr(null); setCode(""); }}>
              Lost your device?
            </button>
          </>
        )}

        {mode === "setup" && (
          <>
            <h1 className="lock-title">Set up your lock.</h1>
            <p className="lock-sub">Enter your one-time setup code, then add this device's passkey.</p>
            <input
              className="lock-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SETUP CODE"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") doSetup(); }}
            />
            <button className="lock-btn lock-btn--passkey" onClick={doSetup} disabled={busy || !code.trim()}>
              <Finger /> {busy ? "Follow your device…" : "Add this passkey"}
            </button>
          </>
        )}

        {mode === "recover" && (
          <>
            <h1 className="lock-title">Lost your device?</h1>
            <p className="lock-sub">Your passkey is normally saved to iCloud or Google, so a new phone
              restores it on its own. If you're truly locked out, enter your setup code to start fresh.</p>
            <input
              className="lock-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SETUP CODE"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") doRecover(); }}
            />
            <button className="lock-btn" onClick={doRecover} disabled={busy || !code.trim()}>
              {busy ? "Checking…" : "Reset & start over"}
            </button>
            <button className="lock-link" onClick={() => { setMode("unlock"); setErr(null); setCode(""); }}>
              Back to unlock
            </button>
          </>
        )}

        {err && <div className="lock-err">{err}</div>}
      </div>
    </div>
  );
}
