"use client"

import { Chat, useChat } from "@ai-sdk/react"
import { generateId, TextStreamChatTransport } from "ai"
import { useRef } from "react"

/**
 * Creates a `Chat` instance whose transport points at `/api/chat` for new
 * messages and `/api/chat/[id]/stream` to resume an in-flight response
 * (e.g. after a page refresh mid-stream) - the client half of the
 * resumable-stream pattern in `src/lib/stream-context.ts` and
 * `src/features/demo/ai/server/chat.ts`.
 */
function createChat() {
  return new Chat({
    id: generateId(),
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/chat/${id}/stream`,
      }),
    }),
  })
}

/**
 * Vercel AI SDK chat hook wired up for resumable streaming (`resume: true`).
 * The `Chat` instance is kept in a ref rather than created inline so it
 * survives re-renders without losing its stream connection.
 */
export function useAiChat() {
  const chatRef = useRef<InstanceType<typeof Chat> | null>(null)
  if (!chatRef.current) chatRef.current = createChat()

  const { messages, sendMessage, status, error } = useChat({
    chat: chatRef.current,
    resume: true,
  })

  return {
    chatId: chatRef.current.id,
    messages,
    sendMessage,
    isLoading: status === "streaming" || status === "submitted",
    error,
  }
}
