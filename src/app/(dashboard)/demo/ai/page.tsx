import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { env } from "@/config/env"
import { AiChat } from "@/features/demo/ai/components/ai-chat"
import { AI_MODEL } from "@/lib/ai"

export default async function AiDemoPage() {
  const t = await getTranslations("demo.ai")

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl">{t("heading")}</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t.rich("intro", {
              code1: (chunks) => (
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {chunks}
                </code>
              ),
              code2: (chunks) => (
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {chunks}
                </code>
              ),
            })}
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {AI_MODEL}
        </Badge>
      </div>

      {!env.OPENROUTER_API_KEY ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              {t("apiKeyMissingTitle")}
            </CardTitle>
            <CardDescription>
              {t.rich("apiKeyMissingBody", {
                code1: (chunks) => (
                  <code className="rounded bg-muted px-1 font-mono text-xs">
                    {chunks}
                  </code>
                ),
                code2: (chunks) => (
                  <code className="font-mono text-xs">{chunks}</code>
                ),
                link: (chunks) => (
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
          <AiChat model={AI_MODEL} />
        </div>
      )}
    </div>
  )
}
