import { runWithLogContext } from "@/lib/logging/context"
import { createLogger } from "@/lib/logging/logger"
import { scrubText } from "@/lib/logging/redaction"
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/logging/request-id"

const log = createLogger("http")

/** Called constantly by the Docker health check, the auth client and Inngest. */
const QUIET_PATHS = ["/api/auth/ok", "/api/auth/get-session", "/api/inngest"]

/**
 * Level of the access line. Successful routine calls to {@link QUIET_PATHS}
 * are `trace`, so they stay out of the console even in development (the
 * Inngest dev server syncs every few seconds). `POST /api/inngest` is not
 * routine, it runs a job step.
 */
function accessLogLevel(method: string, pathname: string, status: number) {
  if (status >= 500) return "warn"
  if (!QUIET_PATHS.includes(pathname)) return "info"

  const isJobRun = method === "POST" && pathname === "/api/inngest"
  return status < 400 && !isJobRun ? "trace" : "debug"
}

/**
 * Wraps a Route Handler: everything logged while it runs carries the request
 * id, and one line with method, path, status and duration is written when it
 * returns. For streamed responses the duration ends when streaming starts. The
 * query string is never logged (it can hold tokens and tRPC inputs). Errors
 * the handler throws are not caught here, `onRequestError` in
 * `src/instrumentation.ts` logs them. Use it for every route under
 * `src/app/api/`.
 */
export function withRequestLogging<
  TRequest extends Request,
  TArgs extends unknown[],
>(handler: (req: TRequest, ...args: TArgs) => Response | Promise<Response>) {
  return (req: TRequest, ...args: TArgs) => {
    const requestId = resolveRequestId(req.headers.get(REQUEST_ID_HEADER))

    return runWithLogContext({ requestId }, async () => {
      const startedAt = performance.now()
      const response = await handler(req, ...args)

      const { pathname } = new URL(req.url)
      const level = accessLogLevel(req.method, pathname, response.status)

      log[level](
        {
          method: req.method,
          path: scrubText(pathname),
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Request handled",
      )

      return response
    })
  }
}
