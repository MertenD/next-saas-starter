import { convertToModelMessages, streamText } from "ai";
import { AI_SYSTEM_PROMPT } from "@/features/demo/ai/model/ai-chat";
import type { ChatRequestInput } from "@/features/demo/ai/schema/ai-chat-schema";
import { AI_MODEL, openrouter } from "@/lib/ai";
import { getStreamContext } from "@/lib/stream-context";

/**
 * Starts (or re-registers) a resumable AI text stream for a chat turn:
 * runs the model via the Vercel AI SDK, then hands the resulting text
 * stream to the resumable-stream context keyed by `id` so a client that
 * reconnects mid-response can pick up where it left off (see
 * `resumeChatStream` below and `useAiChat`'s `prepareReconnectToStreamRequest`).
 * Falls back to the raw `textStream` if the resumable context can't create
 * a new stream (e.g. one already exists for this id).
 */
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

/** Reattaches to an already-running stream for `chatId`, used by the `/api/chat/[id]/stream` route on client reconnect. */
export async function resumeChatStream(chatId: string) {
  const ctx = getStreamContext();
  return ctx.resumeExistingStream(chatId);
}
