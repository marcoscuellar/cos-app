import { type ReactNode } from "react";

// The app has no lock screen. AppLock renders its children directly — kept as a
// thin wrapper so existing call sites don't need to change.
export function AppLock({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
