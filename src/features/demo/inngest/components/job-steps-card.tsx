"use client"

import { ExternalLinkIcon, PlayIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { JOB_STEPS } from "@/features/demo/inngest/model/inngest-demo"

type JobStepsCardProps = {
  onTrigger: () => void
  isPending: boolean
}

export function JobStepsCard({ onTrigger, isPending }: JobStepsCardProps) {
  const t = useTranslations("demo.inngest")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("jobStepsTitle")}</CardTitle>
        <CardDescription>{t("jobStepsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {JOB_STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-mono text-primary text-xs">
                  {i + 1}
                </div>
                {i < JOB_STEPS.length - 1 && (
                  <div className="mt-1 h-full w-px bg-border" />
                )}
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <code className="font-mono text-sm">{step.label}</code>
                </div>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </div>
          )
        })}

        <div className="flex gap-2 pt-2">
          <Button onClick={onTrigger} disabled={isPending}>
            <PlayIcon className="mr-2 h-4 w-4" />
            {isPending ? t("triggeringButton") : t("triggerButton")}
          </Button>
          <Button variant="outline" asChild>
            <a
              href="http://localhost:8288"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              {t("dashboardLinkLabel")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
