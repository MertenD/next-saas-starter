"use client"

import { PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatInput } from "@/features/demo/ai/components/chat-input"
import { ChatMessages } from "@/features/demo/ai/components/chat-messages"
import { useAiChat } from "@/features/demo/ai/hooks/use-ai-chat"
import {
  type ChatSession,
  clearChatSession,
  createChatSession,
  loadChatSession,
} from "@/features/demo/ai/model/chat-session"

/** One chat. Remounted (via `key`) for every new chat id, which creates a fresh `Chat` instance. */
function ChatSessionView({
  session,
  model,
  onNewChat,
}: {
  session: ChatSession
  model: string
  onNewChat: () => void
}) {
  const t = useTranslations("demo.ai")
  const { messages, sendMessage, stop, isLoading, error } = useAiChat(session)

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
          <span className="hidden sm:inline">{t("streamIdLabel")}</span>
          <code className="rounded bg-muted px-1 font-mono">
            {session.id.slice(0, 8)}...
          </code>
          <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
            {t("cachedInRedisBadge")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden font-mono text-xs md:flex">
            {model}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNewChat}
            disabled={isLoading}
          >
            <PlusIcon className="size-4" />
            {t("newChat")}
          </Button>
        </div>
      </div>

      <ChatMessages messages={messages} isLoading={isLoading} error={error} />
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        isLoading={isLoading}
      />
    </div>
  )
}

/**
 * Chat demo container. The chat id lives in `sessionStorage` (see
 * `model/chat-session.ts`), so it stays the same across page refreshes and a
 * mid-stream refresh can resume the response from Redis. "New chat" swaps in a
 * fresh id. The session is read after mount, because storage does not exist
 * during server rendering.
 */
export function AiChat({ model }: { model: string }) {
  const [session, setSession] = useState<ChatSession | null>(null)

  useEffect(() => {
    setSession(loadChatSession())
  }, [])

  const startNewChat = () => {
    clearChatSession()
    setSession(createChatSession())
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  return (
    <ChatSessionView
      key={session.id}
      session={session}
      model={model}
      onNewChat={startNewChat}
    />
  )
}
