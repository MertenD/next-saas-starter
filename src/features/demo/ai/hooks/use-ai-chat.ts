"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { generateId, TextStreamChatTransport } from "ai";
import { useRef } from "react";

function createChat() {
  return new Chat({
    id: generateId(),
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/chat/${id}/stream`,
      }),
    }),
  });
}

export function useAiChat() {
  const chatRef = useRef<InstanceType<typeof Chat> | null>(null);
  if (!chatRef.current) chatRef.current = createChat();

  const { messages, sendMessage, status, error } = useChat({
    chat: chatRef.current,
    resume: true,
  });

  return {
    chatId: chatRef.current.id,
    messages,
    sendMessage,
    isLoading: status === "streaming" || status === "submitted",
    error,
  };
}
