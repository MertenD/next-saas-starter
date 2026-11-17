import * as Sentry from "@sentry/nextjs"
import { getTracesSampleRate } from "./src/config/sentry"

/**
 * Server-side Sentry init (Node runtime), loaded from `src/instrumentation.ts`.
 * Only loaded when `NEXT_PUBLIC_SENTRY_DSN` is set (see the guard there), because
 * even a disabled init patches `fetch`. See `docs/integrations.md`.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    // Traces Vercel AI SDK calls. Prompts and model outputs are only recorded
    // when SENTRY_RECORD_AI_DATA=1, because they can contain personal data.
    Sentry.vercelAIIntegration({
      recordInputs: process.env.SENTRY_RECORD_AI_DATA === "1",
      recordOutputs: process.env.SENTRY_RECORD_AI_DATA === "1",
    }),
  ],

  // Configurable via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE (default: 1 in
  // development, 0.1 in production). Use tracesSampler for finer control.
  tracesSampleRate: getTracesSampleRate(),
})
