import { useState } from "react";

/* Login — the calm threshold. Captures the email as the user's identity. */
export function Login({ onEnter }: { onEnter: (email: string) => void }) {
  const [email, setEmail] = useState("marcos.cuellar@cos.app");
  const submit = () => onEnter(email.trim());
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
          defaultValue="········"
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <button className="lbtn" onClick={submit}>Continue →</button>
        <div className="lfoot">Resume where you left off.</div>
      </div>
    </div>
  );
}
