import pino from "pino"
import pretty from "pino-pretty"
import { resolveLogLevel } from "@/config/log-level"
import { getLogContext } from "@/lib/logging/context"
import { REDACTED_PATHS, serializeError } from "@/lib/logging/redaction"

/**
 * Structured server-side logging (pino). One JSON object per line on stdout in
 * production, readable colored output in development. Server only: client
 * components keep using `console`. See `docs/logging.md`.
 *
 * The rest of `src/lib/logging/`: `context.ts` (ids per request),
 * `redaction.ts` (what must not be written) and `library-calls.ts` (Better Auth
 * and Inngest).
 *
 * Must not import `@/config/env`, because the env validation logs through this
 * module.
 */

const isProduction = process.env.NODE_ENV === "production"

const options: pino.LoggerOptions = {
  level: resolveLogLevel(process.env.LOG_LEVEL),
  // No pid/hostname: the container runtime already identifies the source
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  mixin: () => ({ ...getLogContext() }),
  serializers: { err: serializeError },
  // Second safety net for fields that must never be written
  redact: { paths: REDACTED_PATHS, censor: "[redacted]" },
}

/**
 * The root logger. Call it as `logger.error({ err, ...ids }, "Message")`:
 * pass errors as `err`, put variable data into fields and keep the message
 * constant so it can be searched. Prefer {@link createLogger} in modules.
 */
export const logger = isProduction
  ? pino(options)
  : // pino-pretty as a plain stream: pino's worker-thread transports do not
    // work reliably inside the Next.js bundle
    pino(
      options,
      pretty({ colorize: true, sync: true, translateTime: "SYS:HH:MM:ss.l" }),
    )

/** A child logger that tags every line with the module it comes from. */
export function createLogger(component: string) {
  return logger.child({ component })
}
