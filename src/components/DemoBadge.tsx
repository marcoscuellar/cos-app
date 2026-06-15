import { useEffect, useState } from "react";
import { OWNER_KEY } from "../session";

// A small fixed badge shown on the public demo, so visitors know this is a live,
// read-only sample of COS — not their own workspace. For the owner (a browser
// that has entered the real account before), it also offers a one-tap door back
// into the real workspace. Everyone else just sees the read-only label.
export function DemoBadge() {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    try { setOwner(localStorage.getItem(OWNER_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  return (
    <div className="cos-demo-badge" role="status" aria-label="Live demo">
      <span className="cos-demo-dot" />
      <span className="cos-demo-text">
        Live demo of <strong>COS</strong> · sample data, read-only
      </span>
      {owner && (
        <a className="cos-demo-enter" href="/app?me=1">Back to your workspace →</a>
      )}
    </div>
  );
}
