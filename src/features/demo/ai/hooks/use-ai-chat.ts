"use client"

import { Chat, useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, type UIMessage } from "ai"
import { useEffect, useRef } from "react"
import {
  type ChatSession,
  countTurns,
  saveChatSession,
} from "@/features/demo/ai/model/chat-session"

/**
 * Creates a `Chat` instance for a stored session. The transport points at
 * `/api/chat` for new messages and `/api/chat/[id]/stream?turn=N` to resume an
 * in-flight response (e.g. after a page refresh mid-stream) - the client half
 * of the resumable-stream pattern in `src/lib/stream-context.ts` and
 * `src/features/demo/ai/server/chat.ts`.
 */
function createChat({ id, messages }: ChatSession) {
  const chat: Chat<UIMessage> = new Chat({
    id,
    messages,
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/chat/${id}/stream?turn=${countTurns(chat.messages)}`,
      }),
    }),
  })
  return chat
}

/**
 * Vercel AI SDK chat hook wired up for resumable streaming (`resume: true`).
 * The `Chat` instance is kept in a ref so it survives re-renders; to switch to
 * another chat, remount the component that calls this hook (`key={session.id}`).
 * The conversation is mirrored to `sessionStorage` whenever the assistant is
 * not mid-stream, so a refresh keeps both the chat id and the history. While
 * streaming, only the stream itself lives in Redis and is replayed on resume.
 */
export function useAiChat(session: ChatSession) {
  const chatRef = useRef<Chat<UIMessage> | null>(null)
  if (!chatRef.current) chatRef.current = createChat(session)

  const { messages, sendMessage, status, error, stop } = useChat({
    chat: chatRef.current,
    resume: true,
  })

  /**
   * Stops the answer: aborts the client request AND tells the server to abort
   * the model, because the resumable stream would otherwise keep generating
   * (and burning tokens) in the background. The partial answer stays in the
   * thread and is sent as context with the next message.
   */
  const stopGenerating = () => {
    fetch(`/api/chat/${session.id}/stop?turn=${countTurns(messages)}`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // best effort: the server aborts on its own when the model finishes
    })
    stop()
  }

  const lastRole = messages[messages.length - 1]?.role
  useEffect(() => {
    // Skip while the assistant message is still growing: a partial answer in
    // storage would be duplicated when the resumed stream replays it.
    if (status === "streaming" && lastRole === "assistant") return
    saveChatSession({ id: session.id, messages })
  }, [messages, status, lastRole, session.id])

  return {
    messages,
    sendMessage,
    stop: stopGenerating,
    isLoading: status === "streaming" || status === "submitted",
    error,
  }
}
