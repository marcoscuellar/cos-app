import { useEffect, useRef, useState } from "react";
import type { Project } from "../types";
import { Icon } from "../components/Icon";
import { COS_DATA } from "../data";
import { IS_DEMO } from "../session";
import {
  buildWorkspaceContext,
  ASK_STARTERS,
  type AskActionId,
  type WorkspaceContext,
} from "../askContext";

// ─────────────────────────────────────────────────────────────────────────────
// Ask Ollin — the side panel.
//
// This is NOT chat. One question, full workspace context, one grounded answer.
// The user only ever provides the question; Ollin supplies everything else
// (notes, documents, ideas, tasks, decisions, activity) automatically and
// invisibly. No conversation history, no model selector, no settings.
// ─────────────────────────────────────────────────────────────────────────────

interface AskCOSProps {
  project: Project;
  onClose: () => void;
}

// Context-grounded fallback for when the AI endpoint is unavailable (offline, or
// the plain `vite` dev server with no serverless functions). Still feels
// context-aware because it answers from the packaged workspace context.
function askFallback(ctx: WorkspaceContext): string {
  const parts: string[] = [];
  if (ctx.focus) parts.push(`Right now you're focused on: ${ctx.focus}`);
  if (ctx.blockers.length) parts.push(`What's in the way: ${ctx.blockers.join("; ")}.`);
  if (ctx.openQuestions.length) parts.push(`Open questions you haven't closed: ${ctx.openQuestions.join(" / ")}.`);
  if (ctx.openDecisions.length) parts.push(`Decisions still hanging: ${ctx.openDecisions.join(" / ")}.`);
  if (ctx.nextAction) parts.push(`Your recommended next move: ${ctx.nextAction}`);
  if (!parts.length) parts.push(`I have the context for "${ctx.title}" — add a few notes and ask me again.`);
  return parts.join("\n\n");
}

export function AskCOSPanel({ project, onClose }: AskCOSProps) {
  const p = project;
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [question, answer, busy]);

  const ask = async (text?: string, action: AskActionId = "ask") => {
    const q = (text ?? input).trim();
    if ((!q && action === "ask") || busy) return;
    setInput("");
    setQuestion(q || null);
    setAnswer(null);
    setBusy(true);

    // The workspace IS the context: package everything COS knows and send it
    // with the question. The user never sees or assembles this.
    const context = buildWorkspaceContext(p, COS_DATA.activity);

    let reply: string | null = null;
    try {
      // Demo is read-only — skip the live AI call and fall through to the fallback.
      if (!IS_DEMO) {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ context, question: q, action }),
        });
        if (res.ok) {
          const data = (await res.json()) as { answer?: string };
          reply = data.answer?.trim() || null;
        }
      }
    } catch {
      reply = null;
    }

    if (!reply) {
      await new Promise((r) => setTimeout(r, 500));
      reply = askFallback(context);
    }
    setAnswer(reply);
    setBusy(false);
    inputRef.current?.focus();
  };

  const fresh = question === null && !busy;

  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className={"bs-drawer ac-" + p.accent} onClick={(e) => e.stopPropagation()}>
        <div className="bs-head">
          <div>
            <div className="bs-eye"><span className="d" />Ask Ollin · {p.name}</div>
            <div className="bs-title">Ask Ollin</div>
            <div className="bs-sub">Ollin already knows this workspace. Just ask — no need to explain where you are.</div>
          </div>
          <button className="bs-x" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="bs-body" ref={bodyRef}>
          {fresh && (
            <div className="ask-empty">
              <div className="ask-empty-mark"><Icon.spark style={{ width: 18, height: 18 }} /></div>
              <div className="ask-empty-title">What do you want to know?</div>
              <div className="ask-empty-sub">
                Ollin has your notes, documents, ideas, tasks, decisions, and recent activity for{" "}
                <strong>{p.name}</strong> — all included automatically.
              </div>
            </div>
          )}

          {question && <div className="bs-msg me">{question}</div>}
          {busy && <div className="bs-typing"><i /><i /><i /></div>}
          {answer && !busy && (
            <>
              <div className="bs-msg ai">{answer}</div>
              <button className="ask-again" onClick={() => inputRef.current?.focus()}>
                Ask something else
              </button>
            </>
          )}
        </div>

        {fresh && (
          <div className="bs-chips">
            {ASK_STARTERS.map((c, i) => (
              <button key={i} className="bs-chip" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
        )}

        <div className="bs-foot">
          <div className="ask-context-note">
            <span className="ask-context-dot" /> Workspace context included automatically
          </div>
          <div className="chatbar" style={{ padding: "12px 14px", boxShadow: "none" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
              placeholder={`Ask anything about ${p.name}…`}
            />
            <button className="mic" title="Voice"><Icon.mic /></button>
            <button className="send" title="Ask" onClick={() => ask()}><Icon.send /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
