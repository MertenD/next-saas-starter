import { getTranslations } from "next-intl/server"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { INNGEST_DASHBOARD_URL } from "@/features/demo/inngest/model/inngest-demo"

/** Inline `<code>` element used by every `code1`..`code5` tag in the message. */
function code(chunks: React.ReactNode) {
  return (
    <code className="rounded bg-muted px-1 font-mono text-xs">{chunks}</code>
  )
}

/** Static explainer, rendered on the server (no client JS needed). */
export async function HowItWorksCard() {
  const t = await getTranslations("demo.inngest")

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">
          <strong>{t("howItWorksLabel")}</strong>{" "}
          {t.rich("howItWorksBody", {
            realtimeLink: (chunks) => (
              <a
                href="https://www.inngest.com/docs/features/realtime"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {chunks}
              </a>
            ),
            dashboardLink: (chunks) => (
              <a
                href={INNGEST_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {chunks}
              </a>
            ),
            code1: code,
            code2: code,
            code3: code,
            code4: code,
            code5: code,
          })}
        </p>
      </CardContent>
    </Card>
  )
}
