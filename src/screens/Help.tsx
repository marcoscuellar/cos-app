import { useState } from "react";
import { Scaffold, Mic, ArrowR } from "../components/CosScaffold";
import { COS_DATA } from "../data";

// ─────────────────────────────────────────────────────────────────────────────
// Help (redesign · page 07) — the rescue room. The quietest screen: dark "lights
// low", stripped, reassuring. Where "ADHD's winning today" lands. No title, no
// stats, no lists — the emptiness is the feature. Source: HelpPage.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onNav: (route: string) => void;
  onTalk: (text: string) => void;
}

export function HelpScreen({ onNav, onTalk }: Props) {
  const [input, setInput] = useState("");
  const [sitting, setSitting] = useState(false);

  const submit = () => {
    const q = input.trim();
    if (!q) return;
    onTalk(q);
  };

  return (
    <Scaffold active="bulb" onNav={onNav} dark initial={(COS_DATA.user.greetingName || "M")[0]}>
      <div className="help">
        <div className="help-eyebrow"><span className="help-dot" /> I'VE GOT YOU</div>
        <h2 className="help-serif">Okay. We don't have to do all of it.</h2>
        <p className="help-body">
          Nothing here is on fire. You're allowed to do exactly one small thing — or nothing
          at all for a minute. Both are fine.
        </p>

        {sitting ? (
          <p className="help-ask">I'm right here. No rush, no nudges.</p>
        ) : (
          <>
            <p className="help-ask">Want me to pick the single smallest thing?</p>
            <div className="help-opts">
              <button className="help-btn help-btn-primary" onClick={() => onTalk("Pick the single smallest thing I can do right now — just one, and help me start it.")}>
                Yes — one tiny thing
              </button>
              <button className="help-btn" onClick={() => setSitting(true)}>Let me just sit here</button>
            </div>
          </>
        )}

        <div className="help-inputwrap">
          <div className="cos-input cos-input-dark">
            <button className="cos-mic" tabIndex={-1} aria-label="Voice"><Mic /></button>
            <input
              className="cos-field"
              value={input}
              placeholder="Or tell me what's heavy right now…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            <button className="cos-send" onClick={submit} aria-label="Send"><ArrowR s={19} /></button>
          </div>
        </div>
      </div>
    </Scaffold>
  );
}
