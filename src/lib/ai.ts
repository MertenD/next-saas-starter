import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/config/env";

/**
 * Shared Vercel AI SDK provider for OpenRouter. Use `openrouter(AI_MODEL)`
 * (or another model id) as the `model` passed to `streamText`/`generateText`
 * instead of instantiating a provider per call site.
 */
export const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

/** Default chat model id, configurable via the `AI_MODEL` env var. */
export const AI_MODEL = env.AI_MODEL;
