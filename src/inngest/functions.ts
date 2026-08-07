import { inngest } from "./client"
import { demoJobChannel } from "./realtime"

/**
 * Every event name the app can send/receive through Inngest. Add new events
 * here rather than using raw string literals, and register a matching
 * `inngest.createFunction` below (or in a feature's own server module) to
 * handle it. Functions defined here must also be registered in
 * `src/app/api/inngest/route.ts` to be picked up by the Inngest dev server.
 */
export enum InngestEvents {
  UserSignedUp = "user/signed.up",
  SendWelcomeEmail = "email/send.welcome",
  DemoTriggered = "demo/triggered",
}

// Triggered after a new user signs up - extend this with real logic
export const onUserSignedUp = inngest.createFunction(
  { id: "on-user-signed-up" },
  { event: InngestEvents.UserSignedUp },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s")
    // TODO: send welcome email, provision resources, set up initial data, etc.
    return { message: `Welcome, ${event.data.email}!` }
  },
)

// Demo job - shows multi-step execution, sleep, return values, and
// publishing live progress over Realtime (see src/inngest/realtime.ts).
export const demoJob = inngest.createFunction(
  { id: "demo-job", name: "Demo Background Job" },
  { event: InngestEvents.DemoTriggered },
  async ({ event, step, publish }) => {
    // event.id is the ID returned by inngest.send() - the channel key the
    // client subscribes to. Falls back defensively; always set in practice.
    const status = demoJobChannel(event.id ?? "unknown")

    try {
      // Step 1: Simulate an async data fetch
      await publish(
        status.status({
          status: "running",
          step: "fetch-stats",
          message: "Fetching user & revenue data…",
        }),
      )
      const stats = await step.run("fetch-stats", async () => {
        await new Promise((r) => setTimeout(r, 600))
        return { users: 1_234, posts: 567, revenue: 89_012 }
      })

      // Step 2: Sleep - demonstrates durable scheduling (survives server restarts)
      await publish(
        status.status({
          status: "running",
          step: "processing-delay",
          message: "Waiting 5 seconds…",
        }),
      )
      await step.sleep("processing-delay", "5s")

      // Step 3: Process data and produce a result
      await publish(
        status.status({
          status: "running",
          step: "generate-report",
          message: "Generating report…",
        }),
      )
      const report = await step.run("generate-report", async () => {
        return {
          summary: `Processed ${stats.users} users · ${stats.posts} posts · $${stats.revenue.toLocaleString()} revenue`,
          triggeredBy: event.data.triggeredBy as string,
          completedAt: new Date().toISOString(),
        }
      })

      await publish(
        status.status({
          status: "completed",
          message: "Done",
          output: report,
        }),
      )

      return report
    } catch (err) {
      await publish(
        status.status({
          status: "failed",
          message: err instanceof Error ? err.message : "Job failed",
        }),
      )
      throw err
    }
  },
)
