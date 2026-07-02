import { renderContext, type WorkspaceContext } from "./context.js";
import { getProvider, type AIProvider } from "./provider.js";

// ─────────────────────────────────────────────────────────────────────────────
// Action Engine.
//
// Actions are NOT separate agents. Each is the same context-aware request with a
// different instruction layered on the SAME workspace context. Every action
// receives { context, input, action } and returns an AI response. Ask Ollin V1 is
// just the first action ("ask"); the rest reuse this engine unchanged.
//
// To add an action: add one entry to ACTIONS. No new endpoint, no new context
// plumbing, no provider changes.
// ─────────────────────────────────────────────────────────────────────────────

export type ActionId = "ask" | "continue" | "summarize" | "challenge" | "plan" | "research" | "prepare";

export interface ActionDef {
  id: ActionId;
  /** Whether the action requires the user to type something (ask) vs. self-driving. */
  needsInput: boolean;
  /** The instruction layered onto the shared system prompt for this action. */
  instruction: string;
}

export const ACTIONS: Record<ActionId, ActionDef> = {
  ask: {
    id: "ask",
    needsInput: true,
    instruction: "Answer the user's question directly, grounded in the workspace context above.",
  },
  continue: {
    id: "continue",
    needsInput: false,
    instruction:
      "Help the user pick up exactly where they left off. Point them at the single most useful next move, using the recent activity and next action above.",
  },
  summarize: {
    id: "summarize",
    needsInput: false,
    instruction:
      "Give a tight summary of where this workspace stands: what's done, what's open, and what's next. No preamble.",
  },
  challenge: {
    id: "challenge",
    needsInput: false,
    instruction:
      "Play devil's advocate. Pressure-test the current direction — surface the riskiest assumption, the weakest decision, or the thing being avoided.",
  },
  plan: {
    id: "plan",
    needsInput: false,
    instruction: "Turn the current state into a concrete, ordered short plan the user can act on now.",
  },
  research: {
    id: "research",
    needsInput: false,
    instruction:
      "Identify what the user should look into next and why — the open questions and unknowns that matter most.",
  },
  prepare: {
    id: "prepare",
    needsInput: false,
    instruction:
      "Help the user prepare for what's coming next in this workspace — surface what they'll need and what to have ready.",
  },
};

export function isActionId(v: unknown): v is ActionId {
  return typeof v === "string" && v in ACTIONS;
}

export interface ActionRequest {
  context: WorkspaceContext;
  input: string;
  action: ActionId;
}

/**
 * Run an action: build a provider-agnostic prompt from the workspace context +
 * action instruction + user input, then hand it to the active provider. The
 * engine never knows or cares which model answers.
 */
export async function runAction(req: ActionRequest, provider: AIProvider = getProvider()): Promise<string> {
  const def = ACTIONS[req.action];
  const rendered = renderContext(req.context);

  // COS already lives inside the workspace — it must never ask the user to
  // re-explain where they are or what they're working on.
  const system =
    `You are Ollin, a calm, sharp thinking partner embedded directly inside the user's workspace. ` +
    `You ALREADY have the full context of their workspace below — never ask them to explain where ` +
    `they are, what the project is, or to provide background; you already know it. Ground every ` +
    `answer in the specifics of this workspace (its notes, documents, decisions, and activity), ` +
    `referring to concrete details rather than generic advice. ${def.instruction} ` +
    `Be direct and concrete. No preamble, no meta-commentary about your process, no restating the ` +
    `question. Never invent facts that aren't supported by the context. Keep it under 200 words ` +
    `unless the task genuinely needs more.\n\n` +
    `=== WORKSPACE CONTEXT ===\n${rendered}\n=== END CONTEXT ===`;

  const user = req.input.trim() || def.instruction;
  return provider.generate({ system, user });
}
