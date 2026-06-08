import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAction, isActionId, ACTIONS } from "../lib/server/ai/actions.js";
import { providerConfigured, ProviderError } from "../lib/server/ai/provider.js";
import type { WorkspaceContext } from "../lib/server/ai/context.js";

// ─────────────────────────────────────────────────────────────────────────────
// Ask COS — HTTP entry point. Deliberately thin.
//
//   Workspace → Context Builder (client) → [Action Engine → Provider Adapter] → LLM
//
// This handler only does transport: parse the request, delegate to the action
// engine, map errors to status codes. It has no AI/provider knowledge — that all
// lives behind lib/server/ai/*. Swapping providers never touches this file.
// ─────────────────────────────────────────────────────────────────────────────

interface AskBody {
  context?: WorkspaceContext;
  question?: string;
  action?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!providerConfigured()) {
    return res.status(503).json({ error: "AI is not configured." });
  }

  const body = (req.body ?? {}) as AskBody;
  const context = body.context ?? {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const action = isActionId(body.action) ? body.action : "ask";

  if (ACTIONS[action].needsInput && !question) {
    return res.status(400).json({ error: "No question provided." });
  }

  try {
    const answer = await runAction({ context, input: question, action });
    return res.status(200).json({ answer });
  } catch (err) {
    if (err instanceof ProviderError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unexpected error." });
  }
}
