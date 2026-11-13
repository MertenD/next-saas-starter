"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ChatInput } from "@/features/demo/ai/components/chat-input"
import { ChatMessages } from "@/features/demo/ai/components/chat-messages"
import { useAiChat } from "@/features/demo/ai/hooks/use-ai-chat"

export function AiChat({ model }: { model: string }) {
  const t = useTranslations("demo.ai")
  const { chatId, messages, sendMessage, isLoading, error } = useAiChat()
  // The chat id is random, so the server-rendered HTML and the first client
  // render differ. Only show it after mount to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex h-full w-full flex-col bg-popover">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{t("streamIdLabel")}</span>
          <code className="rounded bg-muted px-1 font-mono">
            {mounted ? chatId.slice(0, 8) : "--------"}…
          </code>
          <Badge variant="secondary" className="text-xs">
            {t("cachedInRedisBadge")}
          </Badge>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {model}
        </Badge>
      </div>

      <ChatMessages messages={messages} isLoading={isLoading} error={error} />
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        isLoading={isLoading}
      />
    </div>
  )
}
