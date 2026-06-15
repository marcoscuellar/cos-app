import { useEffect, useState, type ReactNode } from "react";
import { IS_DEMO } from "../session";
import { authStatus, type AuthStatus } from "../auth";
import { LockScreen } from "./LockScreen";

// The gate. The public demo is always open. The real account is held behind a
// passkey: we check the session, and until it's unlocked we render the LockScreen
// instead of the app — so real data never paints for someone who isn't the owner.
export function AppLock({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    if (IS_DEMO) return; // demo never locks
    let active = true;
    authStatus().then((s) => { if (active) setStatus(s); });
    return () => { active = false; };
  }, []);

  if (IS_DEMO) return <>{children}</>;

  // Resolving the lock state — hold a calm blank so real data never flashes.
  if (!status) return <div style={{ height: "100vh", background: "#14271d" }} />;

  if (!status.authed) {
    return <LockScreen status={status} onUnlocked={() => setStatus({ ...status, authed: true })} />;
  }

  return <>{children}</>;
}
