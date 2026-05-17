import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/config/env";

export const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

export const AI_MODEL = env.AI_MODEL;
