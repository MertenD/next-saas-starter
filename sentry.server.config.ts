import * as Sentry from "@sentry/nextjs"

/**
 * Server-side Sentry init (Node runtime), loaded from `src/instrumentation.ts`.
 * Only loaded when `NEXT_PUBLIC_SENTRY_DSN` is set (see the guard there), because
 * even a disabled init patches `fetch`. See `docs/integrations.md`.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    // Traces Vercel AI SDK calls (prompts/outputs). Remove if prompts may contain sensitive data.
    Sentry.vercelAIIntegration({ recordInputs: true, recordOutputs: true }),
  ],

  // Lower this in production (e.g. 0.1) or use tracesSampler for finer control.
  tracesSampleRate: 1,
})
