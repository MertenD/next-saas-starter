"use client"

import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import type { Run } from "@/features/demo/inngest/model/inngest-demo"
import { useTRPC } from "@/trpc/client"

export function useDemoJobRuns() {
  const trpc = useTRPC()
  const t = useTranslations("demo.inngest")
  const [runs, setRuns] = useState<Run[]>([])

  const { mutate: trigger, isPending } = useMutation(
    trpc.demo.triggerDemoJob.mutationOptions({
      onSuccess: ({ eventId }) => {
        setRuns((prev) => [{ eventId, triggeredAt: new Date() }, ...prev])
        toast.success(t("triggerSuccessTitle"), {
          description: t("triggerSuccessDescription", { eventId }),
        })
      },
      onError: (err) => {
        toast.error(t("triggerErrorTitle"), {
          description: err.message.includes("fetch")
            ? t("triggerErrorDevServer")
            : err.message,
        })
      },
    }),
  )

  return { runs, trigger, isPending }
}
