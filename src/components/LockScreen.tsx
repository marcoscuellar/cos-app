import { useState } from "react";
import { registerOpen, registerPasskey, loginPasskey, recover } from "../auth";

// The gate over a private account. Passkey-first (Touch ID / Face ID / device
// key). New members create an account with an invite code; returning members
// sign in with their passkey. Owner break-glass lives behind "Lost your device?".
// Same design language as the app: white, DM Sans, straight edges, olive accent.

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

type Mode = "unlock" | "register" | "recover";

export function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [mode, setMode] = useState<Mode>("unlock");
  const [code, setCode] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = (m: Mode) => { setMode(m); setErr(null); setCode(""); setShowInvite(false); };

  const unlock = async () => {
    setBusy(true); setErr(null);
    const r = await loginPasskey();
    setBusy(false);
    if (r.ok) onUnlocked(); else setErr(r.error ?? "Couldn't sign you in.");
  };

  const doRegisterOpen = async () => {
    setBusy(true); setErr(null);
    const r = await registerOpen();
    setBusy(false);
    if (r.ok) onUnlocked(); else setErr(r.error ?? "Couldn't create your account.");
  };

  const doRegisterInvite = async () => {
    setBusy(true); setErr(null);
    const r = await registerPasskey(code.trim());
    setBusy(false);
    if (r.ok) onUnlocked(); else setErr(r.error ?? "Couldn't create your account.");
  };

  const doRecover = async () => {
    setBusy(true); setErr(null);
    const r = await recover(code.trim());
    setBusy(false);
    if (r.ok) { setCode(""); setErr(null); setMode("register"); }
    else setErr(r.error ?? "Reset failed.");
  };

  return (
    <div className="lock-wrap">
      <div className="lock-card">
        <div className="lock-mark">Ōllin</div>

        {mode === "unlock" && (
          <>
            <h1 className="lock-title">Welcome back.</h1>
            <p className="lock-sub">Sign in with your passkey — Touch ID, Face ID, or your device key.</p>
            <button className="lock-btn lock-btn--passkey" onClick={unlock} disabled={busy}>
              <Finger /> {busy ? "Waiting for you…" : "Sign in"}
            </button>
            <button className="lock-link" onClick={() => go("register")}>Create your account — free for the Founding 15.</button>
            <button className="lock-link" onClick={() => go("recover")}>Lost your device?</button>
          </>
        )}

        {mode === "register" && (
          <>
            <h1 className="lock-title">Create your account.</h1>
            <p className="lock-sub">Free for the Founding 15 — add a passkey to this device and your rooms are yours alone.</p>
            {!showInvite ? (
              <>
                <button className="lock-btn lock-btn--passkey" onClick={doRegisterOpen} disabled={busy}>
                  <Finger /> {busy ? "Follow your device…" : "Create account"}
                </button>
                <button className="lock-link" onClick={() => { setShowInvite(true); setErr(null); }}>Have an invite code?</button>
              </>
            ) : (
              <>
                <input
                  className="lock-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="INVITE CODE"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") doRegisterInvite(); }}
                />
                <button className="lock-btn lock-btn--passkey" onClick={doRegisterInvite} disabled={busy || !code.trim()}>
                  <Finger /> {busy ? "Follow your device…" : "Create account"}
                </button>
                <button className="lock-link" onClick={() => { setShowInvite(false); setCode(""); setErr(null); }}>Back</button>
              </>
            )}
            <button className="lock-link" onClick={() => go("unlock")}>Already have an account? Sign in.</button>
          </>
        )}

        {mode === "recover" && (
          <>
            <h1 className="lock-title">Lost your device?</h1>
            <p className="lock-sub">Passkeys usually sync via iCloud or Google, so a new phone restores yours on its
              own. If you're truly locked out, enter your setup code to start fresh.</p>
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
            <button className="lock-link" onClick={() => go("unlock")}>Back to sign in.</button>
          </>
        )}

        {err && <div className="lock-err">{err}</div>}
      </div>
    </div>
  );
}
