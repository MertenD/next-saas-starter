import { z } from "zod"

/** The `LOG_LEVEL` used when the variable is unset or empty. */
const DEFAULT_LOG_LEVEL =
  process.env.NODE_ENV === "production" ? "info" : "debug"

/**
 * Schema of the `LOG_LEVEL` variable, the one place for its allowed values and
 * defaults. Part of the env schema in `src/config/env.ts`, and parsed by
 * `src/lib/logging/logger.ts` on its own: the logger cannot import `env.ts`,
 * which reports invalid variables through the logger (import cycle). So this
 * file must not import either of them.
 */
export const logLevelSchema = z.preprocess(
  // `LOG_LEVEL=` in a .env file arrives as an empty string
  (value) => (value === "" ? undefined : value),
  z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default(DEFAULT_LOG_LEVEL),
)

/**
 * The level the logger runs with. Falls back to the default on an invalid
 * value instead of throwing, so the logger still works to report it (the env
 * validation then fails the startup).
 */
export function resolveLogLevel(value: string | undefined) {
  return logLevelSchema.safeParse(value).data ?? DEFAULT_LOG_LEVEL
}
