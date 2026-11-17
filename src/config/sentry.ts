/**
 * Sentry trace sampling rate, shared by every Sentry init (browser:
 * `src/instrumentation-client.ts`, Node: `sentry.server.config.ts`, Edge:
 * `sentry.edge.config.ts`), so the rate is configured in one place.
 *
 * Configure it with `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (a number from 0
 * to 1, e.g. `0.25` traces a quarter of all requests, `0` disables tracing).
 * Without the variable (or with an invalid value) the default applies: every
 * request in development, 10% in production.
 *
 * The `NEXT_PUBLIC_` prefix is required because the browser reads it too, and
 * browser values are inlined at build time (for Docker builds pass it as a
 * build arg, like the DSN). The server and Edge runtimes read it at runtime.
 *
 * Kept free of imports (no `@/config/env`) because it also runs in the browser.
 */
const DEFAULT_PRODUCTION_RATE = 0.1
const DEFAULT_DEVELOPMENT_RATE = 1

/** The `tracesSampleRate` to pass to `Sentry.init`. */
export function getTracesSampleRate(): number {
  const fallback =
    process.env.NODE_ENV === "production"
      ? DEFAULT_PRODUCTION_RATE
      : DEFAULT_DEVELOPMENT_RATE

  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  if (raw === undefined || raw.trim() === "") return fallback

  const rate = Number(raw)
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    console.warn(
      `[sentry] Ignoring NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE="${raw}": expected a number between 0 and 1. Using ${fallback}.`,
    )
    return fallback
  }
  return rate
}
