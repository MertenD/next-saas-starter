"use client"

import { HowItWorksCard } from "@/features/demo/inngest/components/how-it-works-card"
import { JobStepsCard } from "@/features/demo/inngest/components/job-steps-card"
import { RunHistoryCard } from "@/features/demo/inngest/components/run-history-card"
import { useDemoJobRuns } from "@/features/demo/inngest/hooks/use-demo-job-runs"

export function InngestDemoContainer() {
  const { runs, trigger, isPending } = useDemoJobRuns()

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <JobStepsCard onTrigger={() => trigger()} isPending={isPending} />
        <RunHistoryCard
          runs={runs}
          onTrigger={() => trigger()}
          isPending={isPending}
        />
      </div>
      <HowItWorksCard />
    </>
  )
}
