"use client"

import type { UIMessage } from "ai"
import { ArrowDownIcon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { IconActionButton } from "@/components/icon-action-button"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getMessageText,
  MessageRow,
} from "@/features/demo/ai/components/message-row"
import { STREAM_INTERRUPTED_CODE } from "@/features/demo/ai/model/ai-chat"

/** Distance from the bottom (px) within which the view counts as "at the bottom" and keeps following the stream. */
const BOTTOM_THRESHOLD = 80

/** Whether a scroll container is scrolled to (or close to) its bottom. Also true when the content does not overflow at all. */
function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD
}

const SUGGESTION_KEYS = ["suggestion1", "suggestion2", "suggestion3"] as const

type ChatMessagesProps = {
  messages: UIMessage[]
  isLoading: boolean
  error: Error | undefined
  editingId: string | null
  onStartEdit: (messageId: string) => void
  onCancelEdit: () => void
  onEdit: (messageId: string, text: string) => void
  onRegenerate: (messageId: string) => void
  onRetry: () => void
  onSuggestion: (text: string) => void
}

/** Friendly text for the errors the demo knows about, the raw message for everything else. */
function getErrorText(
  error: Error,
  t: ReturnType<typeof useTranslations<"demo.ai">>,
) {
  if (error.message.includes("OPENROUTER_API_KEY")) {
    return t("apiKeyMissingChatError")
  }
  if (error.message.includes(STREAM_INTERRUPTED_CODE)) {
    return t("streamInterruptedError")
  }
  return t("genericError", { message: error.message })
}

/** Single pulsing dot shown in the assistant's slot until the first token arrives. */
function ThinkingIndicator({ label }: { label: string }) {
  return (
    <output aria-label={label} className="block py-2">
      <span className="block size-2.5 animate-pulse rounded-full bg-foreground" />
    </output>
  )
}

export function ChatMessages({
  messages,
  isLoading,
  error,
  editingId,
  onStartEdit,
  onCancelEdit,
  onEdit,
  onRegenerate,
  onRetry,
  onSuggestion,
}: ChatMessagesProps) {
  const t = useTranslations("demo.ai")
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // Whether new content should pull the view down. Cleared when the user
  // scrolls up to read, set again when they return to the bottom or send.
  const followRef = useRef(true)
  const [atBottom, setAtBottom] = useState(true)

  const lastMessage = messages[messages.length - 1]
  const lastTextLength = lastMessage ? getMessageText(lastMessage).length : 0

  // The indicator only bridges the wait for the first token. Once the answer
  // has text, the growing text itself is the feedback.
  const showThinking =
    isLoading &&
    !error &&
    !(lastMessage?.role === "assistant" && lastTextLength > 0)

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = isNearBottom(el)
    followRef.current = nearBottom
    setAtBottom(nearBottom)
  }

  // A scroll event only fires when the user scrolls. When the content gets
  // shorter without a scroll (for example after editing an early message, so
  // the new, shorter chat no longer overflows), the browser fires none, and the
  // scroll-to-bottom button would stay although there is nothing to scroll to.
  // Watching the size catches that. It only ever hides the button; showing it
  // stays up to real scrolling, so growing content while following the stream
  // cannot make it flicker.
  useEffect(() => {
    const el = scrollRef.current
    const content = contentRef.current
    if (!el || !content) return
    const observer = new ResizeObserver(() => {
      if (isNearBottom(el)) {
        followRef.current = true
        setAtBottom(true)
      }
    })
    observer.observe(el)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: follow the stream whenever new content arrives, not on ref changes
  useEffect(() => {
    // Sending always jumps to the bottom, streaming only follows when the user is there.
    if (lastMessage?.role === "user") followRef.current = true
    if (followRef.current) scrollToBottom()
  }, [messages.length, lastTextLength, isLoading, error])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        className="h-full overflow-y-auto"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div
          ref={contentRef}
          role="log"
          aria-live="polite"
          aria-busy={isLoading}
          className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6"
        >
          {messages.length === 0 && !isLoading && (
            <Empty className="my-auto border-0">
              <EmptyHeader>
                <EmptyTitle>{t("startConversation")}</EmptyTitle>
                <EmptyDescription>
                  {t("startConversationBody")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row flex-wrap justify-center">
                {SUGGESTION_KEYS.map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto rounded-full py-2 text-left whitespace-normal"
                    onClick={() => onSuggestion(t(key))}
                  >
                    {t(key)}
                  </Button>
                ))}
              </EmptyContent>
            </Empty>
          )}

          {messages.map((msg) => (
            <MessageRow
              key={msg.id}
              message={msg}
              isEditing={editingId === msg.id}
              canAct={!isLoading}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
            />
          ))}

          {showThinking && <ThinkingIndicator label={t("thinking")} />}

          {error && (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-lg border border-destructive/50 p-4"
            >
              <div className="text-body-sm text-destructive">
                <p className="font-medium">{t("errorHint")}</p>
                <p>{getErrorText(error, t)}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                <RefreshCwIcon className="size-4" />
                {t("retry")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!atBottom && (
        <IconActionButton
          aria-label={t("scrollToBottom")}
          onClick={() => {
            followRef.current = true
            scrollToBottom("smooth")
          }}
          className="-translate-x-1/2 absolute bottom-3 left-1/2 size-10 border border-border bg-background text-foreground shadow-md"
        >
          <ArrowDownIcon />
        </IconActionButton>
      )}
    </div>
  )
}
