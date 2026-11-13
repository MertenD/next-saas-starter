import type { UIMessage } from "ai"
import { z } from "zod"

/** Upper bound on messages per request, so a client cannot send an unbounded history to the model. */
const MAX_MESSAGES = 100

/** Structural check for a `UIMessage` (role and parts); the AI SDK validates the rest when converting. */
function isUIMessage(value: unknown): value is UIMessage {
  if (typeof value !== "object" || value === null) return false
  const message = value as Record<string, unknown>
  return (
    typeof message.id === "string" &&
    (message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system") &&
    Array.isArray(message.parts)
  )
}

export const chatRequestSchema = z.object({
  id: z.string().min(1).max(128),
  messages: z.array(z.custom<UIMessage>(isUIMessage)).max(MAX_MESSAGES),
})

export type ChatRequestInput = z.infer<typeof chatRequestSchema>
