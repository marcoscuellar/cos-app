import { useEffect, useRef, useState } from "react";
import { Scaffold, Mic, ArrowR } from "../components/CosScaffold";
import { COS_DATA } from "../data";
import { IS_DEMO } from "../session";

// ─────────────────────────────────────────────────────────────────────────────
// Conversation (redesign · page 06) — the spine. Submitting on Home opens into
// this calm thread: a slate user bubble, then COS replies with a gold Newsreader
// hook + grounded body + quiet citation chips + quick replies. Wired to the real
// /api/ask (Claude) with a warm stub fallback. Source: ConversationPage.
// ─────────────────────────────────────────────────────────────────────────────

const TZ = "America/Chicago";
type Msg = { role: "you"; text: string } | { role: "cos"; opener: string; body: string };

const STUB =
  "Okay. We don't have to climb the whole thing. Tell me the one thing that's heaviest right now, and we'll start there — everything else can wait.";

// Render a reply as an editorial opener (first sentence, gold) + body (the rest).
function splitReply(text: string): { opener: string; body: string } {
  const m = text.trim().match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (m) return { opener: m[1], body: m[2] };
  return { opener: text.trim(), body: "" };
}

interface Props {
  seed: string;
  onNav: (route: string) => void;
}

export function ConversationScreen({ seed, onNav }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "you", text: q }]);
    setBusy(true);
    let reply: string | null = null;
    try {
      // Demo is read-only — skip the live AI call and fall through to the stub.
      if (!IS_DEMO) {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ context: {}, question: q, action: "ask" }),
        });
        if (res.ok) reply = ((await res.json()) as { answer?: string }).answer?.trim() || null;
      }
    } catch {
      reply = null;
    }
    if (!reply) {
      await new Promise((r) => setTimeout(r, 450));
      reply = STUB;
    }
    setMsgs((m) => [...m, { role: "cos", ...splitReply(reply!) }]);
    setBusy(false);
  };

  // Kick off with the message submitted on Home.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (seed.trim()) ask(seed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  const submit = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    ask(q);
  };

  const time = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", hour: "numeric", minute: "2-digit" })
    .format(new Date()).toUpperCase();

  return (
    <Scaffold active="home" onNav={onNav} initial={(COS_DATA.user.greetingName || "M")[0]}>
      <div className="cv">
        <div className="cv-top">
          <span className="hd-eyebrow">● IN THE ROOM</span>
          <span className="hd-date">{time}</span>
        </div>

        <div className="cv-thread">
          {msgs.map((m, i) =>
            m.role === "you" ? (
              <div className="msg-you" key={i}>{m.text}</div>
            ) : (
              <div className="msg-cos" key={i}>
                {m.opener && <p className="cos-serif">{m.opener}</p>}
                {m.body && <p className="cos-body">{m.body}</p>}
                <div className="cv-cites">
                  <span className="cite">from your library · vetted</span>
                  <span className="cite">your context</span>
                </div>
                <div className="cv-quick">
                  <button className="qbtn qbtn-primary" onClick={() => ask("Yes — let's do that.")}>Let's do it</button>
                  <button className="qbtn" onClick={() => ask("Give me something smaller.")}>Something smaller</button>
                  <button className="qbtn" onClick={() => ask("I just need to sit a minute.")}>Just sit a minute</button>
                </div>
              </div>
            ),
          )}
          {busy && <div className="cv-typing"><i /><i /><i /></div>}
          <div ref={endRef} />
        </div>

        <div className="cv-inputwrap">
          <div className="cos-input">
            <button className="cos-mic" tabIndex={-1} aria-label="Voice"><Mic /></button>
            <input
              className="cos-field"
              value={input}
              placeholder="Say more, or just think out loud…"
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
