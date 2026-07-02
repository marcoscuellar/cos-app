import type { ReactNode } from "react";
import type { Accent, LabAccent, ProjectStatus } from "../types";
import { Icon } from "./Icon";

export function Eyebrow({ children, accent }: { children: ReactNode; accent?: Accent | LabAccent }) {
  return (
    <span className={"eyebrow" + (accent ? " ac-" + accent : "")}>
      <span className="d" />
      {children}
    </span>
  );
}

export function Status({ status }: { status: ProjectStatus }) {
  const label =
    status === "in-motion" ? "In motion" : status === "blocked" ? "Blocked" : status === "dormant" ? "Dormant" : status;
  return (
    <span className={"status " + status}>
      <span className="d" />
      {label}
    </span>
  );
}

/* ---------------- Chat / mic bar ---------------- */
export function ChatBar({
  placeholder,
  big,
  onFocusNav,
}: {
  placeholder?: string;
  big?: boolean;
  onFocusNav?: () => void;
}) {
  return (
    <div className="chatbar" style={big ? { padding: "18px 20px" } : undefined}>
      <input placeholder={placeholder || "Ask Ollin, or capture a thought…"} onFocus={onFocusNav} />
      <button className="mic" title="Voice"><Icon.mic /></button>
      <button className="send" title="Send"><Icon.send /></button>
    </div>
  );
}
