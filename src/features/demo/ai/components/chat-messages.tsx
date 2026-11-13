"use client"

import type { UIMessage } from "ai"
import { BotIcon, UserIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"
import { MarkdownContent } from "@/components/markdown-content"
import { cn } from "@/lib/utils"

type ChatMessagesProps = {
  messages: UIMessage[]
  isLoading: boolean
  error: Error | undefined
}

export function ChatMessages({
  messages,
  isLoading,
  error,
}: ChatMessagesProps) {
  const t = useTranslations("demo.ai")
  const bottomRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new message count, not on ref
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <BotIcon className="h-10 w-10" />
          <p className="font-medium">{t("startConversation")}</p>
          <p className="text-sm">{t("startConversationBody")}</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex gap-3",
            msg.role === "user" ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
            )}
          >
            {msg.role === "user" ? (
              <UserIcon className="h-4 w-4" />
            ) : (
              <BotIcon className="h-4 w-4" />
            )}
          </div>
          <div
            className={cn(
              "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {msg.parts
              ? msg.parts
                  .filter((p) => p.type === "text")
                  .map((p, i) =>
                    msg.role === "assistant" ? (
                      <MarkdownContent
                        key={`${msg.id}-${i}`}
                        content={p.type === "text" ? p.text : ""}
                      />
                    ) : (
                      <span
                        key={`${msg.id}-${i}`}
                        className="whitespace-pre-wrap"
                      >
                        {p.type === "text" ? p.text : ""}
                      </span>
                    ),
                  )
              : null}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <BotIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 rounded-xl bg-muted px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
            <p className="px-1 text-muted-foreground text-xs">
              {t("streamingCaption")}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive">
          {error.message.includes("OPENROUTER_API_KEY")
            ? t("apiKeyMissingChatError")
            : t("genericError", { message: error.message })}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
