/* Login — the calm threshold. */
export function Login({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="login">
      <div className="lglow" />
      <div className="login-inner fade-in">
        <div className="lmark"><div className="cos-logo">COS</div></div>
        <h1>Welcome<br />back.</h1>
        <p className="lsub">Your context is exactly where you left it. Sign in and pick up.</p>
        <input className="lfield" placeholder="you@email.com" defaultValue="founder@cos.app" />
        <input className="lfield" type="password" placeholder="Password" defaultValue="········" />
        <button className="lbtn" onClick={onEnter}>Continue →</button>
        <div className="lfoot">Resume where you left off.</div>
      </div>
    </div>
  );
}
