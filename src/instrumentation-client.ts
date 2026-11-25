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

    // Session Replay is deliberately not enabled: it records what users see and
    // do, which needs a legal basis (usually consent) and a privacy policy entry.
    // To opt in, add `integrations: [Sentry.replayIntegration()]` plus
    // `replaysSessionSampleRate` / `replaysOnErrorSampleRate`, see docs/gdpr.md.

    // Configurable via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE (inlined at build
    // time), see src/config/sentry.ts
    tracesSampleRate: getTracesSampleRate(),
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
