import { useState } from "react";
import { COS_DATA } from "../data";
import { Icon } from "../components/Icon";
import { casualOpener, casualCheckin } from "../brief";

// ─────────────────────────────────────────────────────────────────────────────
// COS front door — a calm, chat-first home.
//
// No dashboard. The page doesn't announce itself; it greets you and asks where
// you are, then hands you a single command line. The chat box is the universal
// entry point: plan the day, jump into a project, or just think out loud.
// Everything else (Today, Projects, Ideas, Lab, Search) lives in the sidebar.
// ─────────────────────────────────────────────────────────────────────────────

interface HomeProps {
  // Whatever the user types or taps is routed by App: project navigation when it
  // names a room, otherwise handed to the AI surface.
  onCommand: (text: string) => void;
}

// The three modes the front door is for — shown as soft starter chips.
const STARTERS = [
  "Create my day",
  "Take me to GLVE",
  "ADHD is kicking my ass — what do I do?",
];

export function HomeScreen({ onCommand }: HomeProps) {
  const opener = casualOpener(COS_DATA.user.greetingName); // "Hey, Marcos."
  const checkin = casualCheckin();                          // rotates daily
  const [input, setInput] = useState("");

  const submit = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    onCommand(q);
  };

  return (
    <div className="wrap cos-front">
      <div className="cf-inner stagger">
        <div className="cf-eyebrow">
          <span className="cf-tick" />
          COS · COGNITIVE OPERATING SYSTEM
        </div>

        <h1 className="cf-greet">
          {opener}
          <br />
          <span className="em">{checkin}</span>
        </h1>

        <div className="cf-composer chatbar">
          <input
            value={input}
            autoFocus
            placeholder="Ask COS, capture a thought, or just think out loud…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
          <button className="mic" title="Voice"><Icon.mic /></button>
          <button className="send" title="Send" onClick={() => submit()}><Icon.send /></button>
        </div>

        <div className="cf-chips">
          {STARTERS.map((s) => (
            <button key={s} className="cf-chip" onClick={() => submit(s)}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
