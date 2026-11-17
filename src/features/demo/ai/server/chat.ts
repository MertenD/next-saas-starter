import { convertToModelMessages, streamText } from "ai"
import { AI_SYSTEM_PROMPT } from "@/features/demo/ai/model/ai-chat"
import { countTurns } from "@/features/demo/ai/model/chat-session"
import type { ChatRequestInput } from "@/features/demo/ai/schema/ai-chat-schema"
import { AI_MODEL, openrouter } from "@/lib/ai"
import { getStreamContext } from "@/lib/stream-context"

/**
 * Resumable-stream key for one turn of a chat. Namespaced by user id, so a
 * stream can only be resumed by the user who started it even though chat ids
 * are chosen by the client, and by turn, so the chat id can stay the same
 * across several questions without a resume replaying an older answer.
 */
function streamKey(userId: string, chatId: string, turn: number) {
  return `${userId}:${chatId}:${turn}`
}

/**
 * Abort controllers of the turns currently being generated on THIS server
 * instance, keyed like the resumable stream. The resumable stream deliberately
 * keeps generating after the client disconnects (refresh, dropped connection),
 * so a client-side abort alone would not stop the model. An explicit stop
 * request aborts it here. In-memory only: with several instances, route the
 * stop request to the one that started the stream (or signal through Redis).
 */
const activeTurns = new Map<string, AbortController>()

/**
 * Starts (or re-registers) a resumable AI text stream for a chat turn:
 * runs the model via the Vercel AI SDK, then hands the resulting text
 * stream to the resumable-stream context keyed by user, `id` and turn (the
 * number of user messages) so a client that reconnects mid-response can pick
 * up where it left off (see `resumeChatStream` below and `useAiChat`'s
 * `prepareReconnectToStreamRequest`).
 * Falls back to the raw `textStream` if the resumable context can't create
 * a new stream (e.g. one already exists for this key).
 */
export async function startChatStream(
  userId: string,
  { id, messages }: ChatRequestInput,
) {
  const key = streamKey(userId, id, countTurns(messages))
  const controller = new AbortController()
  activeTurns.set(key, controller)
  const forget = () => {
    activeTurns.delete(key)
  }

  const result = streamText({
    model: openrouter(AI_MODEL),
    system: AI_SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    abortSignal: controller.signal,
    onFinish: forget,
    onAbort: forget,
    onError: forget,
  })

  const ctx = getStreamContext()
  const stream = await ctx.createNewResumableStream(
    key,
    () => result.textStream,
  )

  return stream ?? result.textStream
}

/** Reattaches to an already-running stream of `userId` for `chatId` and `turn`, used by the `/api/chat/[id]/stream` route on client reconnect. */
export async function resumeChatStream(
  userId: string,
  chatId: string,
  turn: number,
) {
  const ctx = getStreamContext()
  return ctx.resumeExistingStream(streamKey(userId, chatId, turn))
}

/**
 * Aborts the model generation of a running turn (the `/api/chat/[id]/stop`
 * route). Returns `false` when no such turn runs on this instance (already
 * finished, never started, or another user's chat).
 */
export function stopChatStream(userId: string, chatId: string, turn: number) {
  const key = streamKey(userId, chatId, turn)
  const controller = activeTurns.get(key)
  if (!controller) return false
  controller.abort()
  activeTurns.delete(key)
  return true
}
