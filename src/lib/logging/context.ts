import { AsyncLocalStorage } from "node:async_hooks"

/**
 * The ids of the request being handled, which `logger.ts` adds to every log
 * line. See `docs/logging.md`.
 */

/** Fields added to every log line written while handling a request. */
type LogContext = {
  requestId: string
  userId?: string
  /** Inngest: the job run this request belongs to */
  runId?: string
  /** Inngest: the event that triggered the run */
  eventId?: string
}

// Kept on `global` (like `src/lib/db.ts`): Next.js can evaluate this module
// once per bundle, and all copies must see the same request context.
const globalForLogging = global as unknown as {
  logContext?: AsyncLocalStorage<LogContext>
}
const logContext =
  globalForLogging.logContext ?? new AsyncLocalStorage<LogContext>()
globalForLogging.logContext = logContext

/** The context of the request being handled, if any. */
export function getLogContext() {
  return logContext.getStore()
}

/**
 * Runs `fn` so that every log line written inside it (including async work it
 * starts, such as fire-and-forget emails) carries the given context. Used by
 * `withRequestLogging` and the tRPC logging middleware.
 */
export function runWithLogContext<T>(context: LogContext, fn: () => T) {
  return logContext.run(context, fn)
}

/**
 * Adds ids to the log lines written from now on while handling the current
 * request. Does nothing outside of one. `undefined` values are ignored. Ids
 * only, never names or emails.
 */
export function addLogContext(fields: Omit<Partial<LogContext>, "requestId">) {
  const context = logContext.getStore()
  if (!context) return

  const known = Object.entries(fields).filter(([, value]) => value)
  Object.assign(context, Object.fromEntries(known))
}

/** Adds the signed-in user's id to the current request's log lines. */
export function setLogUserId(userId: string) {
  addLogContext({ userId })
}
