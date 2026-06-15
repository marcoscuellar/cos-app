import { useEffect, useState } from "react";
import { OWNER_KEY } from "../session";

// No public demo badge. For the owner (a browser that has entered the real
// account via ?me=1 before), we show a single quiet re-entry pill so you're
// never stranded in the demo. The public sees nothing.
export function DemoBadge() {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    try { setOwner(localStorage.getItem(OWNER_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  if (!owner) return null;
  return <a className="cos-reenter" href="/app?me=1">Back to your workspace →</a>;
}
