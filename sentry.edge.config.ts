import * as Sentry from "@sentry/nextjs"

/**
 * Sentry init for the Edge runtime (middleware, edge routes), loaded from
 * `src/instrumentation.ts`. Only loaded when `NEXT_PUBLIC_SENTRY_DSN` is set.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
})
