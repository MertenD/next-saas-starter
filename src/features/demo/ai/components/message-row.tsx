"use client"

import type { UIMessage } from "ai"
import { PencilIcon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { memo, useState } from "react"
import { CopyButton } from "@/components/copy-button"
import { IconActionButton } from "@/components/icon-action-button"
import { MarkdownContent } from "@/components/markdown-content"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

/** Plain text of a message: its text parts joined (the AI chat renders no other part types). */
export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("")
}

/** Inline editor for a user message; saving truncates the chat after it and asks the model again. */
function EditForm({
  initialText,
  onSave,
  onCancel,
}: {
  initialText: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const t = useTranslations("demo.ai")
  const [draft, setDraft] = useState(initialText)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (draft.trim()) onSave(draft)
  }

  return (
    <form
      onSubmit={submit}
      className="ml-auto flex w-full max-w-[85%] flex-col gap-2 rounded-2xl border border-border bg-background p-3"
    >
      <Textarea
        autoFocus
        aria-label={t("editLabel")}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel()
        }}
        className="min-h-16 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:outline-none dark:bg-transparent"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t("cancelEdit")}
        </Button>
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          {t("saveEdit")}
        </Button>
      </div>
    </form>
  )
}

/** Right-aligned soft bubble for the user; copy and edit appear on hover (always visible on touch screens). */
function UserRow({
  message,
  text,
  isEditing,
  canAct,
  onStartEdit,
  onCancelEdit,
  onEdit,
}: {
  message: UIMessage
  text: string
  isEditing: boolean
  canAct: boolean
  onStartEdit: (messageId: string) => void
  onCancelEdit: () => void
  onEdit: (messageId: string, text: string) => void
}) {
  const t = useTranslations("demo.ai")

  if (isEditing) {
    return (
      <EditForm
        initialText={text}
        onSave={(next) => onEdit(message.id, next)}
        onCancel={onCancelEdit}
      />
    )
  }

  return (
    <div className="group flex flex-col items-end gap-1">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-secondary px-4 py-2.5 text-body-md text-foreground">
        {text}
      </div>
      {canAct && (
        <div className="flex transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <CopyButton text={text} />
          <IconActionButton
            aria-label={t("editMessage")}
            onClick={() => onStartEdit(message.id)}
          >
            <PencilIcon />
          </IconActionButton>
        </div>
      )}
    </div>
  )
}

/** Assistant answers are plain text on the page background (no bubble, no avatar) with copy and regenerate below. */
function AssistantRow({
  message,
  text,
  canAct,
  onRegenerate,
}: {
  message: UIMessage
  text: string
  canAct: boolean
  onRegenerate: (messageId: string) => void
}) {
  const t = useTranslations("demo.ai")

  return (
    <div>
      <div className="break-words text-body-md text-foreground">
        <MarkdownContent content={text} />
      </div>
      {canAct && (
        <div className="-ml-2 mt-1 flex">
          <CopyButton text={text} />
          <IconActionButton
            aria-label={t("regenerate")}
            onClick={() => onRegenerate(message.id)}
          >
            <RefreshCwIcon />
          </IconActionButton>
        </div>
      )}
    </div>
  )
}

/**
 * One chat message. Memoized: while an answer streams, only the last message
 * object changes, so earlier messages (and their Markdown parse) are skipped.
 */
export const MessageRow = memo(function MessageRow({
  message,
  isEditing,
  canAct,
  onStartEdit,
  onCancelEdit,
  onEdit,
  onRegenerate,
}: {
  message: UIMessage
  isEditing: boolean
  canAct: boolean
  onStartEdit: (messageId: string) => void
  onCancelEdit: () => void
  onEdit: (messageId: string, text: string) => void
  onRegenerate: (messageId: string) => void
}) {
  const text = getMessageText(message)

  if (message.role === "user") {
    return (
      <UserRow
        message={message}
        text={text}
        isEditing={isEditing}
        canAct={canAct}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onEdit={onEdit}
      />
    )
  }

  // An answer aborted before its first token has no text to show.
  if (!text) return null

  return (
    <AssistantRow
      message={message}
      text={text}
      canAct={canAct}
      onRegenerate={onRegenerate}
    />
  )
})
