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
  isLoading: boolean
}

export function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const t = useTranslations("demo.ai")
  const isMobile = useIsMobile()
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input)
    setInput("")
  }

  // On mobile Enter inserts a newline (there is the send button); on desktop Enter sends.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 px-4 pb-3">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-3xl border border-border bg-background py-2 pr-2 pl-4 shadow-sm focus-within:border-foreground">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("inputPlaceholder")}
            rows={Math.min(6, Math.max(1, input.split("\n").length))}
            className="max-h-40 min-h-10 resize-none border-0 bg-transparent px-0 py-2 text-body-md shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon-sm"
              className="shrink-0 rounded-full"
              onClick={onStop}
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
