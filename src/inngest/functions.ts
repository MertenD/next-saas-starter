import prisma from "@/lib/db"
import { inngest } from "./client"
import { demoJobChannel, demoJobKey } from "./realtime"

/**
 * Every event name the app can send/receive through Inngest. Add new events
 * here rather than using raw string literals, and register a matching
 * `inngest.createFunction` below (or in a feature's own server module) to
 * handle it. Functions defined here must also be registered in
 * `src/app/api/inngest/route.ts` to be picked up by the Inngest dev server.
 */
export const InngestEvents = {
  UserSignedUp: "user/signed.up",
  SendWelcomeEmail: "email/send.welcome",
  DemoTriggered: "demo/triggered",
} as const

/** Union of all event name strings in {@link InngestEvents}. */
export type InngestEventName =
  (typeof InngestEvents)[keyof typeof InngestEvents]

// Triggered after a new user signs up (sent from the Better Auth user-create
// hook in `src/lib/auth.ts`) - extend this with real logic
export const onUserSignedUp = inngest.createFunction(
  { id: "on-user-signed-up" },
  { event: InngestEvents.UserSignedUp },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s")
    // TODO: send welcome email, provision resources, set up initial data, etc.
    // Events only carry the user id: Inngest stores event payloads, so look up
    // name or email in the database inside the step instead of sending them.
    return { message: `Welcome, user ${event.data.userId}!` }
  },
)

/**
 * Daily purge of expired sessions and verification tokens. Better Auth only
 * ignores expired rows, it never deletes them, so without this job old IP
 * addresses and user agents (sessions) and one-time tokens (verifications)
 * would stay in the database for good. See `docs/gdpr.md` (retention).
 */
export const cleanupExpiredAuthData = inngest.createFunction(
  {
    id: "cleanup-expired-auth-data",
    name: "Purge expired sessions and verification tokens",
  },
  { cron: "0 3 * * *" },
  async ({ step }) => {
    const sessions = await step.run("delete-expired-sessions", async () => {
      const { count } = await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
      return count
    })
    const verifications = await step.run(
      "delete-expired-verifications",
      async () => {
        const { count } = await prisma.verification.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        })
        return count
      },
    )

    return { sessions, verifications }
  },
)

// Demo job - shows multi-step execution, sleep, return values, and
// publishing live progress over Realtime (see src/inngest/realtime.ts).
export const demoJob = inngest.createFunction(
  { id: "demo-job", name: "Demo Background Job" },
  { event: InngestEvents.DemoTriggered },
  async ({ event, step, publish }) => {
    // event.id is the ID returned by inngest.send(); together with the
    // triggering user's id it forms the channel key the client subscribes to
    // (see `demoJobKey`). Falls back defensively; always set in practice.
    const status = demoJobChannel(
      demoJobKey(String(event.data.userId ?? "unknown"), event.id ?? "unknown"),
    )

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
