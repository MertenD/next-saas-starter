import * as Sentry from "@sentry/nextjs"
import type { Instrumentation } from "next"
import { REQUEST_ID_HEADER } from "@/lib/logging/request-id"

/**
 * Next.js instrumentation hook: loads the matching Sentry config for the
 * runtime the server process is using. Does nothing when
 * `NEXT_PUBLIC_SENTRY_DSN` is unset: even a disabled `Sentry.init` installs
 * OpenTelemetry instrumentation (it patches `fetch` and can break outgoing
 * requests such as Polar calls), so Sentry must not be initialized at all
 * unless it is actually configured.
 */
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

/**
 * Reports errors thrown in Server Components, Route Handlers and Server
 * Actions: to Sentry (a no-op when it is not configured) and as a structured
 * log line with the request id. The query string is cut off the path.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  Sentry.captureRequestError(error, request, context)

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { createLogger } = await import("@/lib/logging/logger")
    const { scrubText } = await import("@/lib/logging/redaction")
    const [pathname = ""] = request.path.split("?")
    createLogger("next").error(
      {
        err: error,
        requestId: request.headers[REQUEST_ID_HEADER],
        method: request.method,
        path: scrubText(pathname),
        route: context.routePath,
        routeType: context.routeType,
      },
      "Unhandled server error",
    )
  }
}
