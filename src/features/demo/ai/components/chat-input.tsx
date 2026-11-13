"use client"

import { SendIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"

type ChatInputProps = {
  onSend: (text: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
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
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-border border-t p-2"
    >
      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("inputPlaceholder")}
          rows={Math.min(3, Math.max(1, input.split("\n").length))}
          className="max-h-32 min-h-10 resize-none py-2 text-body-sm"
        />
        <Button
          type="submit"
          size="icon-sm"
          className="shrink-0"
          disabled={isLoading || !input.trim()}
          aria-label={t("sendLabel")}
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 text-caption-sm text-muted-foreground">
        {t("inputHint")}
      </p>
    </form>
  )
}
