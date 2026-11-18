"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { IconActionButton } from "@/components/icon-action-button"

/**
 * Icon button that copies `text` to the clipboard and shows a check mark for
 * two seconds. Shows an error toast when the clipboard is unavailable (for
 * example on an insecure origin). Used for AI chat messages and code blocks.
 */
export function CopyButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const t = useTranslations("common.copyButton")
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("failed"))
    }
  }

  return (
    <IconActionButton
      onClick={copy}
      className={className}
      aria-label={copied ? t("copied") : t("copy")}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </IconActionButton>
  )
}
