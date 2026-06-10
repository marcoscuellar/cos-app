import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────────────────────────────────────
// Provider Adapter layer.
//
// The Context Engine is the product; the LLM is infrastructure. Everything above
// this file (UI, context builder, action engine) is provider-agnostic and never
// learns which model answered. Swapping Anthropic for OpenAI/Gemini/Local means
// adding one class here and one line in getProvider() — nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────

/** A single generation request, normalized across providers. */
export interface AIPrompt {
  system: string;
  user: string;
  maxTokens?: number;
}

/** The swappable contract. Implementations map AIPrompt onto their own API. */
export interface AIProvider {
  readonly name: string;
  generate(prompt: AIPrompt): Promise<string>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

// ── Anthropic (initial implementation) ──────────────────────────────────────
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client = new Anthropic();
  private model: string;

  constructor(model = process.env.AI_MODEL || "claude-opus-4-8") {
    this.model = model;
  }

  async generate({ system, user, maxTokens = 1024 }: AIPrompt): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        thinking: { type: "disabled" },
        system,
        messages: [{ role: "user", content: user }],
      });
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        // Surface the real cause (401 bad key, 403 no access, 400 billing, 429
        // rate limit, …) in logs and to the caller, instead of a flat 502.
        console.error("[ai] Anthropic APIError", {
          status: err.status,
          type: (err as { type?: string }).type,
          message: err.message,
        });
        throw new ProviderError(err.message || "AI is unavailable right now.", err.status ?? 502);
      }
      console.error("[ai] Unexpected provider error", err);
      throw new ProviderError("Unexpected error.", 500);
    }
  }
}

// Future: export class OpenAIProvider / GeminiProvider / LocalProvider here.

/** Is any provider configured (credentials present)? */
export function providerConfigured(): boolean {
  const which = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  switch (which) {
    case "anthropic":
      return Boolean(process.env.ANTHROPIC_API_KEY);
    default:
      return Boolean(process.env.ANTHROPIC_API_KEY);
  }
}

/**
 * Select the active provider. Defaults to Anthropic; override with AI_PROVIDER.
 * Callers above this layer must never branch on the result's concrete type.
 */
export function getProvider(): AIProvider {
  const which = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  switch (which) {
    case "anthropic":
      return new AnthropicProvider();
    // case "openai": return new OpenAIProvider();
    // case "gemini": return new GeminiProvider();
    // case "local":  return new LocalProvider();
    default:
      return new AnthropicProvider();
  }
}
