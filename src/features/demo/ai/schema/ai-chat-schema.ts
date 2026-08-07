import type { UIMessage } from "ai";
import { z } from "zod";

export const chatRequestSchema = z.object({
  id: z.string(),
  messages: z.array(z.custom<UIMessage>()),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
