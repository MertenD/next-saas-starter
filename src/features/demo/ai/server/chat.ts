import { convertToModelMessages, streamText } from "ai";
import { AI_SYSTEM_PROMPT } from "@/features/demo/ai/model/ai-chat";
import type { ChatRequestInput } from "@/features/demo/ai/schema/ai-chat-schema";
import { AI_MODEL, openrouter } from "@/lib/ai";
import { getStreamContext } from "@/lib/stream-context";

export async function startChatStream({ id, messages }: ChatRequestInput) {
  const result = streamText({
    model: openrouter(AI_MODEL),
    system: AI_SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
  });

  const ctx = getStreamContext();
  const stream = await ctx.createNewResumableStream(
    id,
    () => result.textStream,
  );

  return stream ?? result.textStream;
}

export async function resumeChatStream(chatId: string) {
  const ctx = getStreamContext();
  return ctx.resumeExistingStream(chatId);
}
