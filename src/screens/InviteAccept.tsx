import { useEffect, useState } from "react";
import { setToken } from "../auth";

type Phase = "loading" | "ready" | "invalid" | "done";

/* Invite acceptance page (/invite?token=…) — validates the token, lets the
   invitee set a name + password, then creates the account and signs them in. */
export function InviteAccept() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setPhase("invalid");
      return;
    }
    (async () => {
      try {
        const r = await fetch(`/api/invite?token=${encodeURIComponent(token)}`);
        const d = (await r.json()) as { ok?: boolean; email?: string; name?: string };
        if (r.ok && d.ok && d.email) {
          setEmail(d.email);
          setName(d.name || "");
          setPhase("ready");
        } else {
          setPhase("invalid");
        }
      } catch {
        setPhase("invalid");
      }
    })();
  }, [token]);

  const submit = async () => {
    if (busy) return;
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const d = (await r.json()) as { ok?: boolean; token?: string | null; error?: string };
      if (r.ok && d.ok) {
        if (d.token) setToken(d.token);
        setPhase("done");
        setTimeout(() => { window.location.href = "/"; }, 900);
      } else {
        setError(d.error || "Couldn't complete setup.");
      }
    } catch {
      setError("Couldn't complete setup.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="lglow" />
      <div className="login-inner fade-in">
        <div className="lmark"><div className="cos-logo">COS</div></div>

        {phase === "loading" && <p className="lsub">Checking your invite…</p>}

        {phase === "invalid" && (
          <>
            <h1>Invite expired.</h1>
            <p className="lsub">This invite link is invalid or has expired. Ask your admin for a new one.</p>
            <a className="lbtn" href="/" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>Go to sign in</a>
          </>
        )}

        {phase === "done" && (
          <>
            <h1>You're in.</h1>
            <p className="lsub">Account created — taking you to COS…</p>
          </>
        )}

        {phase === "ready" && (
          <>
            <h1>Set up<br />your account.</h1>
            <p className="lsub">You've been invited as <b style={{ color: "var(--ink-2)" }}>{email}</b>. Choose a password to finish.</p>
            <input className="lfield" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <input
              className="lfield"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (8+ characters)"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            {error && <div style={{ color: "var(--a-coral)", fontSize: 13, margin: "2px 0 8px", fontWeight: 500 }}>{error}</div>}
            <button className="lbtn" onClick={submit} disabled={busy}>{busy ? "Setting up…" : "Create account →"}</button>
          </>
        )}
      </div>
    </div>
  );
}
