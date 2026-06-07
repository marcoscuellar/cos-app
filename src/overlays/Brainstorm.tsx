import { useEffect, useRef, useState } from "react";
import type { Project } from "../types";
import { Icon } from "../components/Icon";

interface Message {
  role: "ai" | "me";
  text: string;
}

// Per-project starter chips. AI brainstorms only when invited.
const BS_CHIPS: Record<string, string[]> = {
  brand: ["Draft a LinkedIn post on continuity", "Give me 10 hooks for a post", "Turn my notes into a thread", "What should I post this week?"],
  glve: ["Pressure-test the six-engine spec", "Draft the pricing one-pager", "What am I missing?"],
  cos: ["Name the homepage: Now or Home?", "Poke holes in chat-first", "What's the riskiest assumption?"],
  _default: ["Help me think this through", "What should I do next?", "Play devil's advocate", "Summarize where I am"],
};

// Graceful, project-aware fallback when no LLM endpoint is wired up.
function bsFallback(project: Project, text: string): string {
  const t = text.toLowerCase();
  const name = project.name;
  if (t.includes("hook")) {
    return "Here are a few hooks to pull from — punchy, first-line tested:\n\n1. \"Most productivity tools help you store. None help you return.\"\n2. \"I don't have a memory problem. I have a re-entry problem.\"\n3. \"The expensive moment isn't losing the file. It's the morning after a week away.\"\n4. \"Systems beat willpower. Here's the one I rebuilt this month.\"\n\nWant me to expand any of these into a full post?";
  }
  if (t.includes("linkedin") || t.includes("post") || t.includes("draft")) {
    return "Here's a draft built on your three pillars — systems, calm, continuity:\n\n———\nWe treat forgetting as failure. It isn't.\n\nThe real cost was never losing information — it's the cost of *returning* to it. Rebuilding the thread every time you come back.\n\nSo I stopped optimizing for storage and started optimizing for re-entry. One question every project has to answer before I ask: where was I?\n\nCalm isn't the absence of work. It's the absence of reconstruction.\n———\n\nWant it punchier, longer, or with a softer open?";
  }
  if (t.includes("thread")) {
    return "I'd shape it as a 5-tweet thread:\n\n1. The hook — the re-entry problem in one line\n2. Why storage tools miss it\n3. The reframe: continuity over storage\n4. The one concrete practice you use\n5. The takeaway + a question to drive replies\n\nWant me to write each one out?";
  }
  if (t.includes("week") || t.includes("next")) {
    return `For ${name} this week, I'd pick ONE: ship the opening essay on continuity. It's your strongest pillar and everything else can ladder to it. Want me to outline it?`;
  }
  return `Let's think it through for ${name}. Give me the rough shape — the angle, the audience, or just the mess in your head — and I'll throw a few directions back. No wrong answers here; this is the sandbox.`;
}

interface BrainstormProps {
  project: Project;
  onClose: () => void;
}

export function BrainstormPanel({ project, onClose }: BrainstormProps) {
  const p = project;
  const chips = BS_CHIPS[p.id] || BS_CHIPS._default;
  const greeting =
    p.id === "brand"
      ? `Let's throw ideas around for ${p.name}. LinkedIn posts, hooks, a thread — what are we riffing on?`
      : `Let's think out loud about ${p.name}. I'll brainstorm, poke holes, and draft — you stay the author. Where do you want to start?`;
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;
    setInput("");
    const history: Message[] = [...messages, { role: "me", text: msg }];
    setMessages(history);
    setBusy(true);

    let reply: string | null = null;
    try {
      // Calls the /api/brainstorm serverless function, which runs Claude with
      // the ANTHROPIC_API_KEY server-side. The key never reaches the browser.
      const res = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: { id: p.id, name: p.name, why: p.why, notes: p.notes },
          messages: history,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        reply = data.reply?.trim() || null;
      }
    } catch {
      reply = null;
    }

    if (!reply) {
      // Graceful fallback when the AI endpoint is unavailable (offline, or the
      // `vite` dev server without serverless functions).
      await new Promise((r) => setTimeout(r, 650));
      reply = bsFallback(p, msg);
    }
    setMessages((m) => [...m, { role: "ai", text: reply!.trim() }]);
    setBusy(false);
  };

  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className={"bs-drawer ac-" + p.accent} onClick={(e) => e.stopPropagation()}>
        <div className="bs-head">
          <div>
            <div className="bs-eye"><span className="d" />Brainstorm · {p.name}</div>
            <div className="bs-title">Throw ideas around</div>
            <div className="bs-sub">Invited, off the record. Nothing is saved unless you keep it.</div>
          </div>
          <button className="bs-x" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="bs-body" ref={bodyRef}>
          {messages.map((m, i) => <div key={i} className={"bs-msg " + m.role}>{m.text}</div>)}
          {busy && <div className="bs-typing"><i /><i /><i /></div>}
        </div>

        {messages.length <= 1 && (
          <div className="bs-chips">
            {chips.map((c, i) => <button key={i} className="bs-chip" onClick={() => send(c)}>{c}</button>)}
          </div>
        )}

        <div className="bs-foot">
          <div className="chatbar" style={{ padding: "12px 14px", boxShadow: "none" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={"Riff with COS about " + p.name + "…"} />
            <button className="mic" title="Voice"><Icon.mic /></button>
            <button className="send" title="Send" onClick={() => send()}><Icon.send /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
