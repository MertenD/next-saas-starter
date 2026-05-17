"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  PlayIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";

function getJobSteps(t: (key: string) => string) {
  return [
    {
      id: "fetch-stats",
      label: "fetch-stats",
      description: t("stepFetchDescription"),
      icon: ZapIcon,
    },
    {
      id: "sleep",
      label: "step.sleep",
      description: t("stepSleepDescription"),
      icon: ClockIcon,
    },
    {
      id: "generate-report",
      label: "generate-report",
      description: t("stepReportDescription"),
      icon: CheckCircleIcon,
    },
  ];
}

type Run = {
  eventId: string;
  triggeredAt: string;
};

function RunStatusBadge({ eventId }: { eventId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const t = useTranslations("demo.inngest");

  // Streams status updates over Inngest Realtime instead of polling - the
  // dev job publishes as it moves through each step (src/inngest/functions.ts).
  const { latestData, error } = useInngestSubscription({
    refreshToken: () =>
      queryClient.fetchQuery(
        trpc.demo.getJobSubscriptionToken.queryOptions({ eventId }),
      ),
    bufferInterval: 300,
  });

  if (error) {
    return (
      <Badge variant="outline" className="gap-1" title={error.message}>
        <HelpCircleIcon className="size-3" />
        {t("statusUnknown")}
      </Badge>
    );
  }

  const update = latestData?.data;

  if (!update || update.status === "running") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Spinner className="size-3" />
        {update?.message ?? t("statusQueued")}
      </Badge>
    );
  }

  if (update.status === "completed") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircleIcon className="size-3" />
        {t("statusCompleted")}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1" title={update.message}>
      <XCircleIcon className="size-3" />
      {t("statusFailed")}
    </Badge>
  );
}

export default function InngestDemoPage() {
  const trpc = useTRPC();
  const t = useTranslations("demo.inngest");
  const [runs, setRuns] = useState<Run[]>([]);
  const jobSteps = getJobSteps(t);

  const { mutate: trigger, isPending } = useMutation(
    trpc.demo.triggerDemoJob.mutationOptions({
      onSuccess: ({ eventId }) => {
        setRuns((prev) => [
          { eventId, triggeredAt: new Date().toLocaleTimeString() },
          ...prev,
        ]);
        toast.success(t("triggerSuccessTitle"), {
          description: t("triggerSuccessDescription", { eventId }),
        });
      },
      onError: (err) => {
        toast.error(t("triggerErrorTitle"), {
          description: err.message.includes("fetch")
            ? t("triggerErrorDevServer")
            : err.message,
        });
      },
    }),
  );

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-bold text-2xl">{t("heading")}</h1>
        <p className="mt-1 text-muted-foreground text-sm">{t("intro")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Job definition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("jobStepsTitle")}</CardTitle>
            <CardDescription>{t("jobStepsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-mono text-primary text-xs">
                      {i + 1}
                    </div>
                    {i < jobSteps.length - 1 && (
                      <div className="mt-1 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <code className="font-mono text-sm">{step.label}</code>
                    </div>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2 pt-2">
              <Button onClick={() => trigger()} disabled={isPending}>
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

        {/* Run history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("triggeredRunsTitle")}
            </CardTitle>
            <CardDescription>{t("triggeredRunsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ZapIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t("noRunsTitle")}</EmptyTitle>
                  <EmptyDescription>{t("noRunsDescription")}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => trigger()}
                    disabled={isPending}
                  >
                    <PlayIcon className="mr-2 h-4 w-4" />
                    {isPending ? t("triggeringButton") : t("triggerButton")}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <ul className="space-y-2">
                {runs.map((run) => (
                  <li
                    key={run.eventId}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {run.eventId}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("triggeredAtLabel", { time: run.triggeredAt })}
                      </p>
                    </div>
                    <RunStatusBadge eventId={run.eventId} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
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
                  href="http://localhost:8288"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {chunks}
                </a>
              ),
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
              code3: (chunks) => (
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {chunks}
                </code>
              ),
              code4: (chunks) => (
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {chunks}
                </code>
              ),
              code5: (chunks) => (
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {chunks}
                </code>
              ),
            })}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
