import { InngestMiddleware } from "inngest"
import { addLogContext, getLogContext } from "@/lib/logging/context"
import { createLogger } from "@/lib/logging/logger"

const log = createLogger("inngest")

/** The `userId` of an event payload, if it carries one. */
function userIdOf(data: unknown) {
  if (typeof data !== "object" || data === null) return undefined
  const { userId } = data as { userId?: unknown }
  return typeof userId === "string" ? userId : undefined
}

/** The one user all events belong to, `undefined` if unknown or mixed. */
function commonUserId(payloads: readonly { data?: unknown }[]) {
  const userIds = new Set(payloads.map((payload) => userIdOf(payload.data)))
  return userIds.size === 1 ? [...userIds][0] : undefined
}

/**
 * Makes background jobs traceable in the logs. A job run consists of many
 * HTTP requests, each with its own `requestId`, so:
 *
 * - While a function runs, `runId`, `eventId` and the event's `userId` are
 *   added to the log context of the request (see `withRequestLogging`). All
 *   later lines of that request carry them, including its access line.
 * - Every sent event is logged with its name and id. That line has the context
 *   of the sender, which links the action that sent it to the run. A sender
 *   without a signed-in user (sign-up) takes the `userId` from the events.
 *
 * `userId` is the only thing read from an event payload, see `docs/gdpr.md`.
 * Registered on the client in `src/inngest/client.ts`. See `docs/logging.md`.
 */
export const loggingMiddleware = new InngestMiddleware({
  name: "logging",
  init() {
    return {
      onFunctionRun({ ctx }) {
        addLogContext({
          runId: ctx.runId,
          eventId: ctx.event.id,
          userId: userIdOf(ctx.event.data),
        })
        return {}
      },
      onSendEvent() {
        let eventNames: string[] = []
        let userId: string | undefined
        return {
          transformInput({ payloads }) {
            eventNames = payloads.map((payload) => payload.name)
            userId = commonUserId(payloads)
          },
          transformOutput({ result }) {
            if (result.ids.length === 0) return

            // The sender's own userId wins: whoever sends an event about
            // another user must stay visible as the sender
            const addUserId = userId && !getLogContext()?.userId
            log.info(
              {
                eventNames,
                eventIds: result.ids,
                ...(addUserId ? { userId } : {}),
              },
              "Events sent",
            )
          },
        }
      },
    }
  },
})
