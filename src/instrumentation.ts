import * as Sentry from "@sentry/nextjs"

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

/** Reports errors thrown in Server Components, Route Handlers and Server Actions. */
export const onRequestError = Sentry.captureRequestError
