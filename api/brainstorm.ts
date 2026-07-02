import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser, unauthorized } from "../lib/server/session.js";

// The ANTHROPIC_API_KEY is read from the environment (set in Vercel) and never
// leaves the server — the client only ever talks to this function.
const client = new Anthropic();

interface IncomingMessage {
  role: "ai" | "me";
  text: string;
}

interface BrainstormBody {
  project: { id?: string; name?: string; why?: string; notes?: string[] };
  messages: IncomingMessage[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "AI is not configured." });
  }
  if (!(await requireUser(req))) return unauthorized(res);

  const body = req.body as BrainstormBody;
  const project = body?.project ?? {};
  const incoming = Array.isArray(body?.messages) ? body.messages : [];

  // The conversation always opens with COS's greeting (an assistant turn). The
  // Messages API requires the first message to be from the user, so drop any
  // leading assistant turns before mapping roles.
  const mapped = incoming.map((m) => ({
    role: (m.role === "me" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));
  while (mapped.length && mapped[0].role === "assistant") mapped.shift();

  if (!mapped.length) {
    return res.status(400).json({ error: "No user message to respond to." });
  }

  const name = project.name || "this project";
  const why = project.why || "";
  const notes = (project.notes || []).join(" ");

  // COS is a supporting character: it brainstorms, drafts, and pokes holes only
  // when invited, and never silently authors decisions. Keep replies brief.
  const system =
    `You are Ollin, a calm, sharp thinking partner helping the user brainstorm inside ` +
    `their project "${name}"${why ? ` — ${why}` : ""}.` +
    (notes ? ` Project notes: ${notes}.` : "") +
    ` The user is riffing, not asking for a lecture. Offer concrete drafts, hooks, or angles. ` +
    `You may brainstorm and play devil's advocate, but never make decisions for the user or ` +
    `claim something is decided — keep your output clearly a draft they can take or leave. ` +
    `Respond directly with your reply only: no preamble, no meta-commentary about your process, ` +
    `and keep it warm, concrete, and under 130 words.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      // Snappy chat reply — disable thinking so there's no pre-output pause,
      // and the system prompt above keeps the response to a direct answer.
      thinking: { type: "disabled" },
      system,
      messages: mapped,
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return res.status(200).json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      // Don't leak internals to the client; the UI falls back gracefully.
      return res.status(502).json({ error: "AI is unavailable right now." });
    }
    return res.status(500).json({ error: "Unexpected error." });
  }
}
