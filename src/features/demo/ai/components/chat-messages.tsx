"use client"

import type { UIMessage } from "ai"
import { useTranslations } from "next-intl"
import { memo, useEffect, useRef } from "react"
import { MarkdownContent } from "@/components/markdown-content"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

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

/** Right-aligned soft bubble for the user, like in Claude.ai and ChatGPT. */
function UserRow({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-secondary px-4 py-2.5 text-body-md text-foreground">
        {text}
      </div>
    </div>
  )
}

/** Assistant answers are plain text on the page background, no bubble and no avatar. */
function AssistantRow({ text }: { text: string }) {
  return (
    <div className="break-words text-body-md text-foreground">
      <MarkdownContent content={text} />
    </div>
  )
}

/** Single pulsing dot shown in the assistant's slot until the first token arrives. */
function ThinkingIndicator({ label }: { label: string }) {
  return (
    <output aria-label={label} className="block py-2">
      <span className="block size-2.5 animate-pulse rounded-full bg-foreground" />
    </output>
  )
}

/**
 * One chat message. Memoized: while an answer streams, only the last message
 * object changes, so earlier messages (and their Markdown parse) are skipped.
 */
const MessageRow = memo(function MessageRow({
  message,
}: {
  message: UIMessage
}) {
  const text = getMessageText(message)

  if (message.role === "user") {
    return <UserRow text={text} />
  }

  return <AssistantRow text={text} />
})

export function ChatMessages({
  messages,
  isLoading,
  error,
}: ChatMessagesProps) {
  const t = useTranslations("demo.ai")
  const scrollRef = useRef<HTMLDivElement>(null)

  const lastMessage = messages[messages.length - 1]
  const lastTextLength = lastMessage ? getMessageText(lastMessage).length : 0

  // The indicator only bridges the wait for the first token. Once the answer
  // has text, the growing text itself is the feedback.
  const showThinking =
    isLoading && !(lastMessage?.role === "assistant" && lastTextLength > 0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the bottom whenever new content arrives, not on ref changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, lastTextLength, isLoading])

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6">
        {messages.length === 0 && !isLoading && (
          <Empty className="my-auto border-0">
            <EmptyHeader>
              <EmptyTitle>{t("startConversation")}</EmptyTitle>
              <EmptyDescription>{t("startConversationBody")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {messages.map((msg) => (
          <MessageRow key={msg.id} message={msg} />
        ))}

        {showThinking && <ThinkingIndicator label={t("thinking")} />}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 p-3 text-body-sm text-destructive"
          >
            {error.message.includes("OPENROUTER_API_KEY")
              ? t("apiKeyMissingChatError")
              : t("genericError", { message: error.message })}
          </div>
        )}
      </div>
    </div>
  )
}
