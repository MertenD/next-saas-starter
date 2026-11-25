import type pino from "pino"
import { scrubText } from "@/lib/logging/redaction"

type LibraryLogLevel = "error" | "warn" | "info" | "debug"

/** Field names pino or the logger set themselves. */
const RESERVED_FIELDS = ["err", "msg", "level", "time", "component"]

/**
 * The fields of an object argument that are safe to keep: numbers, booleans and
 * ids (string values of keys ending in `Id`). Everything else is dropped.
 */
function safeFields(args: unknown[]) {
  const fields: Record<string, string | number | boolean> = {}

  for (const arg of args) {
    if (typeof arg !== "object" || arg === null) continue
    if (arg instanceof Error || Array.isArray(arg)) continue

    for (const [key, value] of Object.entries(arg)) {
      if (RESERVED_FIELDS.includes(key)) continue
      if (typeof value === "number" || typeof value === "boolean") {
        fields[key] = value
      } else if (typeof value === "string" && key.endsWith("Id")) {
        fields[key] = scrubText(value)
      }
    }
  }

  return fields
}

/**
 * Forwards a `console`-style call from a library logger (Better Auth, Inngest,
 * including `ctx.logger` in job functions) to pino. Strings become the message
 * and the first error becomes `err`. Of other objects only numbers, booleans
 * and ids are kept, because libraries pass emails and request data there.
 */
export function logLibraryCall(
  target: pino.Logger,
  level: LibraryLogLevel,
  args: unknown[],
) {
  const error = args
    .flatMap((arg) => {
      if (typeof arg !== "object" || arg === null) return [arg]
      const { err, error } = arg as { err?: unknown; error?: unknown }
      return [arg, err, error]
    })
    .find((candidate) => candidate instanceof Error)

  const text = args.filter((arg) => typeof arg === "string").join(" ")
  const message = scrubText(text || error?.message || "(no message)")

  target[level](
    { ...safeFields(args), ...(error ? { err: error } : {}) },
    message,
  )
}
