import { useState } from "react";

const TEST_EMAIL = "test@costhread.app";

/* Login — the calm threshold. Validates through /api/login (which enforces the
   time-limited test account server-side), then hands the email to App. */
export function Login({ onEnter }: { onEnter: (email: string) => void }) {
  const [email, setEmail] = useState("marcos.cuellar@cos.app");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await r.json()) as { ok?: boolean; email?: string; error?: string };
      if (r.ok && data.ok) {
        onEnter(data.email || email.trim());
        return;
      }
      setError(data.error || "Login failed.");
    } catch {
      // Endpoint unreachable (e.g. plain `vite` dev). Fail closed for the gated
      // test account; let demo accounts through so local dev still works.
      if (email.trim().toLowerCase() === TEST_EMAIL) {
        setError("Can't verify the test login right now. Try again shortly.");
      } else {
        onEnter(email.trim());
      }
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
