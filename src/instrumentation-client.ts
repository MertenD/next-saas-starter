import * as Sentry from "@sentry/nextjs"
import { getTracesSampleRate } from "@/config/sentry"

/**
 * Browser-side Sentry init, run by Next.js before the app hydrates. Skipped
 * entirely when no DSN is set.
 * `NEXT_PUBLIC_SENTRY_DSN` is inlined at *build* time - for Docker builds it
 * must be passed as a build arg (see `docker-compose.prod.yml`).
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    integrations: [Sentry.replayIntegration()],

    // Configurable via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE (inlined at build
    // time), see src/config/sentry.ts
    tracesSampleRate: getTracesSampleRate(),

    // Session replays: 10% of sessions, 100% of sessions with an error.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
