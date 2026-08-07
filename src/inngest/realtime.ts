import { channel, topic } from "@inngest/realtime"
import { z } from "zod"

// Streamed status updates for a single demoJob run, scoped by event ID so
// each triggered run gets its own channel. Published from within demoJob
// (src/inngest/functions.ts) and consumed client-side via
// useInngestSubscription (@inngest/realtime/hooks) instead of polling.
export const demoJobStatusSchema = z.object({
  status: z.enum(["running", "completed", "failed"]),
  step: z
    .enum(["fetch-stats", "processing-delay", "generate-report"])
    .optional(),
  message: z.string(),
  output: z
    .object({
      summary: z.string(),
      triggeredBy: z.string(),
      completedAt: z.string(),
    })
    .optional(),
})

export type DemoJobStatus = z.infer<typeof demoJobStatusSchema>

export const demoJobChannel = channel(
  (eventId: string) => `demo-job:${eventId}`,
).addTopic(topic("status").schema(demoJobStatusSchema))
