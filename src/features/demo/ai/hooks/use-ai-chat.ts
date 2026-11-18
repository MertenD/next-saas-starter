"use client"

import { Chat, useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, type UIMessage } from "ai"
import { useEffect, useRef } from "react"
import { usePageLeaving } from "@/features/demo/ai/hooks/use-page-leaving"
import {
  type ChatSession,
  saveChatSession,
} from "@/features/demo/ai/model/chat-session"
import { getLiveChat, type LiveChat } from "@/features/demo/ai/model/live-chat"

/**
 * Creates the `Chat` for a stored session (called through `getLiveChat()` the
 * first time a conversation is opened). The transport posts new messages to
 * `/api/chat` and reconnects to a response that is still being generated via
 * `/api/chat/[id]/stream` - the client half of the resumable-stream pattern in
 * `src/lib/stream-context.ts` and `src/features/demo/ai/server/chat.ts`.
 *
 * `onFinish` saves the finished conversation itself. While the user is on
 * another page no component is mounted to do it, and without it a reload or
 * closing the tab during that time would lose the answer: the stream is
 * already finished by then, so the resume finds nothing to replay. Interrupted
 * runs (stop, page unload, network error) are not saved here, `useAiChat`
 * handles those while it is mounted.
 */
function createChat({ id, messages }: ChatSession) {
  const chat: Chat<UIMessage> = new Chat({
    id,
    messages,
    onFinish: ({ messages: finished, isAbort, isDisconnect, isError }) => {
      if (isAbort || isDisconnect || isError) return
      saveChatSession({ id, messages: finished })
    },
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/chat/${id}/stream`,
      }),
    }),
  })
  return chat
}

/**
 * Vercel AI SDK chat hook for the AI chat demo, wired up for resumable
 * streaming. The `Chat` comes from `getLiveChat()` (one per conversation,
 * shared by all visits of the page) and is kept in a ref so it survives
 * re-renders; to switch to another chat, remount the component that calls this
 * hook (`key={session.id}`). The conversation is mirrored to `sessionStorage`
 * whenever the assistant is not mid-stream, so a refresh keeps both the chat id
 * and the history. While streaming, only the stream itself lives in Redis and
 * is replayed on resume.
 */
export function useAiChat(session: ChatSession) {
  const liveRef = useRef<LiveChat | null>(null)
  if (!liveRef.current) liveRef.current = getLiveChat(session, createChat)

  const { messages, sendMessage, regenerate, status, error, stop } = useChat({
    chat: liveRef.current.chat,
  })

  // Reconnecting to a response that is still being generated (for example after
  // a page refresh) is started here instead of with the `resume: true` option
  // of `useChat`. That option reconnects from an effect on mount, which can run
  // twice (React strict mode mounts everything twice in development), and every
  // reconnect request adds its own assistant message. The flag on the live chat
  // makes it happen once per chat.
  //
  // It is also skipped unless the conversation ends with an unanswered
  // question, because only then an answer can be in progress. That saves a
  // request and avoids a flash of the "generating" state: while the SDK checks
  // for a stream it reports the same "submitted" status as when a message is
  // sent.
  useEffect(() => {
    const live = liveRef.current
    if (!live || live.resumeTried) return
    live.resumeTried = true
    if (live.chat.lastMessage?.role === "user") live.chat.resumeStream()
  }, [])

  /**
   * Stops the answer: aborts the client request AND tells the server to abort
   * the model, because the resumable stream would otherwise keep generating
   * (and burning tokens) in the background. The partial answer stays in the
   * thread and is sent as context with the next message.
   */
  const stopGenerating = () => {
    fetch(`/api/chat/${session.id}/stop`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // best effort: the server aborts on its own when the model finishes
    })
    stop()
  }

  const { leavingRef, isLeaving } = usePageLeaving()

  const lastRole = messages[messages.length - 1]?.role
  useEffect(() => {
    if (leavingRef.current) return
    // While an answer is being generated, never store its partial message:
    // the resumed stream replays the whole answer as a NEW message, so a
    // stored partial one would show up twice after a refresh. `messages` can
    // already hold the first chunk while `status` is still "submitted", so
    // both busy states count.
    const busy = status === "submitted" || status === "streaming"
    saveChatSession({
      id: session.id,
      messages:
        busy && lastRole === "assistant" ? messages.slice(0, -1) : messages,
    })
  }, [messages, status, lastRole, session.id, leavingRef])

  return {
    messages,
    sendMessage,
    stop: stopGenerating,
    /** Asks the model again for the answer to `messageId` (and drops everything after it). */
    regenerate: (messageId: string) => regenerate({ messageId }),
    /** Retries after an error: re-sends the thread as it is (the failed answer is dropped). */
    retry: () => regenerate(),
    /** Replaces the user message `messageId` with `text`, drops everything after it and asks the model again. */
    edit: (messageId: string, text: string) => sendMessage({ text, messageId }),
    isLoading: status === "streaming" || status === "submitted",
    error: isLeaving ? undefined : error,
  }
}
