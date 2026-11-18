import { convertToModelMessages, streamText } from "ai"
import { AI_SYSTEM_PROMPT } from "@/features/demo/ai/model/ai-chat"
import type { ChatRequestInput } from "@/features/demo/ai/schema/ai-chat-schema"
import { AI_MODEL, openrouter } from "@/lib/ai"
import { getRedis } from "@/lib/redis"
import { getStreamContext } from "@/lib/stream-context"

/** How long the pointer to a chat's active attempt lives in Redis (same order as the resumable stream's own TTL). */
const ACTIVE_ATTEMPT_TTL_SECONDS = 60 * 60 * 24

/**
 * Resumable-stream key for ONE generation attempt of a chat. Namespaced by user
 * id, so a stream can only be resumed by the user who started it even though
 * chat ids are chosen by the client. Every attempt (new question, regenerate,
 * edit, retry) gets its own `attemptId`: reusing a key would make the resumable
 * context hand back the old, already partly generated stream instead of a new
 * answer.
 */
function streamKey(userId: string, chatId: string, attemptId: string) {
  return `${userId}:${chatId}:${attemptId}`
}

/** Redis key pointing at the newest attempt of a chat, which is the one a reconnecting client resumes. */
function activeAttemptKey(userId: string, chatId: string) {
  return `ai-chat:active:${userId}:${chatId}`
}

/** Key of the in-memory abort controller map: one running generation per chat. */
function chatKey(userId: string, chatId: string) {
  return `${userId}:${chatId}`
}

const globalForGenerations = global as unknown as {
  aiChatGenerations?: Map<string, AbortController>
}

/**
 * Abort controllers of the chats currently generating on THIS server instance.
 * The resumable stream deliberately keeps generating after the client
 * disconnects (refresh, dropped connection), so a client-side abort alone would
 * not stop the model. An explicit stop request aborts it here. In-memory only:
 * with several instances, route the stop request to the one that started the
 * stream (or signal through Redis).
 *
 * Kept on `global` (like `src/lib/db.ts`): in dev every route handler gets its
 * own copy of this module, so a module-level map would not be shared between
 * `/api/chat` (starts a generation) and `/api/chat/[id]/stop` (aborts it).
 */
const activeGenerations =
  globalForGenerations.aiChatGenerations ?? new Map<string, AbortController>()
globalForGenerations.aiChatGenerations = activeGenerations

/**
 * Starts a resumable AI text stream for one attempt: runs the model via the
 * Vercel AI SDK, then hands the resulting text stream to the resumable-stream
 * context under a fresh per-attempt key, and records that attempt as the
 * chat's active one in Redis so a client that reconnects mid-response can pick
 * up where it left off (see `resumeChatStream` below and `useAiChat`'s
 * `prepareReconnectToStreamRequest`). A still-running older generation of the
 * same chat is aborted first. Falls back to the raw `textStream` if the
 * resumable context can't create a stream.
 */
export async function startChatStream(
  userId: string,
  { id, messages }: ChatRequestInput,
) {
  const generationKey = chatKey(userId, id)
  activeGenerations.get(generationKey)?.abort()

  const controller = new AbortController()
  activeGenerations.set(generationKey, controller)
  // Only forget our own controller: a newer attempt may have replaced it already.
  const forget = () => {
    if (activeGenerations.get(generationKey) === controller) {
      activeGenerations.delete(generationKey)
    }
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

  const attemptId = crypto.randomUUID()
  const redis = await getRedis()
  await redis.set(activeAttemptKey(userId, id), attemptId, {
    EX: ACTIVE_ATTEMPT_TTL_SECONDS,
  })

  const ctx = getStreamContext()
  const stream = await ctx.createNewResumableStream(
    streamKey(userId, id, attemptId),
    () => result.textStream,
  )

  return stream ?? result.textStream
}

/**
 * Reattaches to the newest attempt of `chatId` for `userId`, used by the
 * `/api/chat/[id]/stream` route on client reconnect. Returns `undefined` when
 * the chat has no attempt and `null` when it already finished.
 */
export async function resumeChatStream(userId: string, chatId: string) {
  const redis = await getRedis()
  const attemptId = await redis.get(activeAttemptKey(userId, chatId))
  if (!attemptId) return undefined

  const ctx = getStreamContext()
  return ctx.resumeExistingStream(streamKey(userId, chatId, attemptId))
}

/**
 * Aborts the model generation of a running chat (the `/api/chat/[id]/stop`
 * route). Returns `false` when nothing is generating for that chat on this
 * instance (already finished, never started, or another user's chat).
 */
export function stopChatStream(userId: string, chatId: string) {
  const key = chatKey(userId, chatId)
  const controller = activeGenerations.get(key)
  if (!controller) return false
  controller.abort()
  activeGenerations.delete(key)
  return true
}
