import { useState } from "react";
import type { User } from "./types";
import { login as doLogin } from "./auth";

const TEST_EMAIL = "test@costhread.app";

/* Login — validates through /api/login (KV-backed users + the time-limited test
   account), stores the session token, and hands the user up to App. */
export function Login({ onAuthed }: { onAuthed: (user: User) => void }) {
  // Prefilled with the admin email for convenience; editable.
  const [email, setEmail] = useState("marcosmcuellar@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const res = await doLogin(email.trim(), password);
      if (res.ok && res.user) {
        onAuthed(res.user);
        return;
      }
      setError(res.error || "Login failed.");
    } catch {
      setError(
        email.trim().toLowerCase() === TEST_EMAIL
          ? "Can't verify the test login right now. Try again shortly."
          : "Login is unavailable right now.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="lglow" />
      <div className="login-inner fade-in">
        <div className="lmark"><div className="cos-logo">COS</div></div>
        <h1>Welcome<br />back.</h1>
        <p className="lsub">Your context is exactly where you left it. Sign in and pick up.</p>
        <input
          className="lfield"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          className="lfield"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {error && (
          <div style={{ color: "var(--a-coral)", fontSize: 13, margin: "2px 0 8px", fontWeight: 500 }}>
            {error}
          </div>
        )}
        <button className="lbtn" onClick={submit} disabled={busy}>
          {busy ? "Continuing…" : "Continue →"}
        </button>
        <div className="lfoot">Resume where you left off.</div>
      </div>
    </div>
  );
}
