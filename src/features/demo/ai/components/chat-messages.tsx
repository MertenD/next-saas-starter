"use client"

import type { UIMessage } from "ai"
import { BotIcon, UserIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type React from "react"
import { useEffect, useRef } from "react"
import { MarkdownContent } from "@/components/markdown-content"
import { cn } from "@/lib/utils"

type ChatMessagesProps = {
  messages: UIMessage[]
  isLoading: boolean
  error: Error | undefined
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("")
}

/** Avatar bubble shown next to every message (bot on the left, user on the right). */
function Avatar({ sender }: { sender: "assistant" | "user" }) {
  const Icon = sender === "user" ? UserIcon : BotIcon

  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
        sender === "user" ? "bg-primary/20" : "bg-primary/10",
      )}
    >
      <Icon className="h-4 w-4 text-primary" />
    </div>
  )
}

/** Assistant row: avatar on the left, muted bubble with a flat bottom-left corner. */
function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex w-full justify-start gap-2">
      <Avatar sender="assistant" />
      <div className="max-w-[80%] break-words rounded-lg rounded-bl-none bg-muted px-3 py-2 text-foreground text-sm">
        {children}
      </div>
    </div>
  )
}

/** User row: primary bubble with a flat bottom-right corner, avatar on the right. */
function UserRow({ text }: { text: string }) {
  return (
    <div className="mb-4 flex w-full justify-end gap-2">
      <div className="max-w-[80%] break-words rounded-lg rounded-br-none bg-primary px-3 py-2 text-primary-foreground text-sm">
        <span className="whitespace-pre-wrap">{text}</span>
      </div>
      <Avatar sender="user" />
    </div>
  )
}

export function ChatMessages({
  messages,
  isLoading,
  error,
}: ChatMessagesProps) {
  const t = useTranslations("demo.ai")
  const scrollRef = useRef<HTMLDivElement>(null)

  const lastMessage = messages[messages.length - 1]
  const lastTextLength = lastMessage ? getMessageText(lastMessage).length : 0

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the bottom whenever new content arrives, not on ref changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, lastTextLength, isLoading])

  return (
    <div className="flex-1 overflow-y-auto p-2" ref={scrollRef}>
      {/* Welcome message, always the first bubble of the conversation */}
      <AssistantRow>
        <p className="font-medium">{t("startConversation")}</p>
        <p className="mt-1">{t("startConversationBody")}</p>
      </AssistantRow>

      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserRow key={msg.id} text={getMessageText(msg)} />
        ) : (
          <AssistantRow key={msg.id}>
            <MarkdownContent content={getMessageText(msg)} />
          </AssistantRow>
        ),
      )}

      {isLoading && (
        <div className="mb-4 flex w-full justify-start gap-2">
          <Avatar sender="assistant" />
          <div className="flex max-w-[80%] flex-col gap-1.5">
            <div className="flex items-center gap-1 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
            <p className="text-muted-foreground text-xs">
              {t("streamingCaption")}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 p-3 text-destructive text-sm">
          {error.message.includes("OPENROUTER_API_KEY")
            ? t("apiKeyMissingChatError")
            : t("genericError", { message: error.message })}
        </div>
      )}
    </div>
  )
}
