import * as Sentry from "@sentry/nextjs"
import { getTracesSampleRate } from "./src/config/sentry"

/**
 * Sentry init for the Edge runtime (edge routes, `src/proxy.ts` runs on Node), loaded
 * from `src/instrumentation.ts`. Only loaded when `NEXT_PUBLIC_SENTRY_DSN` is
 * set. The template has no Edge code today, so this file stays dormant until
 * you add some; it is kept so Edge errors are reported from day one.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Configurable via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE, see src/config/sentry.ts
  tracesSampleRate: getTracesSampleRate(),
})
