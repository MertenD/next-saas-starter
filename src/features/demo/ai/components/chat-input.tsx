"use client"

import { ArrowUpIcon, SquareIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"

type ChatInputProps = {
  onSend: (text: string) => void
  onStop: () => void
  /** Called on ArrowUp in an empty field: start editing the last user message. */
  onEditLast: () => void
  isLoading: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

/**
 * Composer in the style of Claude.ai / ChatGPT: one rounded container with a
 * borderless auto-growing textarea and a round send (or, while an answer is
 * generating, stop) button inside it. Keeps the focus in the field after
 * sending or stopping, so the user can keep typing.
 */
export function ChatInput({
  onSend,
  onStop,
  onEditLast,
  isLoading,
  textareaRef,
}: ChatInputProps) {
  const t = useTranslations("demo.ai")
  const isMobile = useIsMobile()
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input)
    setInput("")
    textareaRef.current?.focus()
  }

  // On mobile Enter inserts a newline (there is the send button); on desktop Enter sends.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    } else if (e.key === "ArrowUp" && !input && !isLoading) {
      e.preventDefault()
      onEditLast()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 px-4 pb-3">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-3xl border border-border bg-background py-2 pr-2 pl-4 shadow-sm focus-within:border-foreground">
          <Textarea
            ref={textareaRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("inputPlaceholder")}
            rows={Math.min(6, Math.max(1, input.split("\n").length))}
            className="max-h-40 min-h-10 resize-none border-0 bg-transparent px-0 py-2 text-body-md shadow-none focus-visible:outline-none dark:bg-transparent"
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon-sm"
              className="shrink-0 rounded-full"
              onClick={() => {
                onStop()
                textareaRef.current?.focus()
              }}
              aria-label={t("stopLabel")}
            >
              <SquareIcon className="size-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              className="shrink-0 rounded-full"
              disabled={!input.trim()}
              aria-label={t("sendLabel")}
            >
              <ArrowUpIcon className="size-5" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-caption-sm text-muted-foreground">
          {isLoading ? t("streamingCaption") : t("inputHint")}
        </p>
      </div>
    </form>
  )
}
