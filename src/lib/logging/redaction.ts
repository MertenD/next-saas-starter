/**
 * Everything that keeps personal data and secrets out of the logs: scrubbing of
 * free text, the allow-list error serializer and the redacted field names.
 * Covered by `redaction.test.ts`: add a case there for every new rule.
 */

/** Names that mark a value as a credential, also as part of a longer name (`access_token`, `clientSecret`). */
const SECRET_NAME = "(?:token|secret|password|passwd|api[_-]?key)"

const SCRUB_RULES: [RegExp, string][] = [
  // Email addresses, also URL-encoded once or more (%40, %2540). The length
  // limits keep long texts without a match from taking quadratic time.
  [
    /[A-Z0-9._%+-]{1,64}(?:@|%(?:25)*40)[A-Z0-9.-]{1,253}\.[A-Z]{2,}/gi,
    "[email]",
  ],
  // `name=value` of a credential: query strings, form bodies, encoded URLs
  [
    new RegExp(`(${SECRET_NAME}(?:=|%3D))(?:(?!%26)[^&#\\s"',;])+`, "gi"),
    "$1[redacted]",
  ],
  // Too generic to match anywhere, only as query parameters (one-time links)
  [/([?&#](?:code|state|key)=)[^&#\s"']+/gi, "$1[redacted]"],
  // `"name": "value"` of a credential in JSON or a printed object
  [
    new RegExp(
      `(${SECRET_NAME}["']?\\s*:\\s*)(["'])(?:\\\\.|(?!\\2)[^\\\\])*\\2`,
      "gi",
    ),
    "$1$2[redacted]$2",
  ],
  // The same inside a string that was serialized a second time: \"name\":\"value\"
  [
    new RegExp(`(${SECRET_NAME}\\\\"\\s*:\\s*\\\\")[^\\\\]+`, "gi"),
    "$1[redacted]",
  ],
  // Password reset token in the path
  [/(\/reset-password\/)[^/?\s"']+/gi, "$1[redacted]"],
  // Credentials in headers and connection strings
  [/(Bearer\s+)[A-Za-z0-9._~+/=-]+/g, "$1[redacted]"],
  [/([a-z][a-z0-9+.-]{0,30}:\/\/)[^/\s:@]*:[^/\s@]+@/gi, "$1[redacted]@"],
]

/**
 * Removes email addresses, one-time tokens and credentials from free text such
 * as error messages and paths. A safety net, not a license to log personal
 * data.
 */
export function scrubText(text: string) {
  return SCRUB_RULES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  )
}

const MAX_CAUSE_DEPTH = 3

/**
 * Turns an error into the logged `err` object using an allow list. pino's
 * default serializer copies every property, and SDK errors carry request and
 * response bodies, headers (with API tokens) or AI prompts there.
 */
export function serializeError(
  error: unknown,
  depth = 0,
): Record<string, unknown> {
  if (typeof error !== "object" || error === null) {
    return { message: scrubText(String(error)) }
  }

  const source = error as Record<string, unknown>
  const type =
    typeof source.name === "string" ? source.name : error.constructor.name
  let message = typeof source.message === "string" ? source.message : ""

  // Prisma prints the whole query, including the written values, into this
  // message. Only the last line says what is actually wrong.
  if (type === "PrismaClientValidationError") {
    message = message.trim().split("\n").at(-1) ?? ""
  }

  const result: Record<string, unknown> = { type, message: scrubText(message) }

  // Only the frames: the head of a stack repeats the unscrubbed message
  if (typeof source.stack === "string") {
    const frames = source.stack
      .split("\n")
      .filter((line) => /^\s+at /.test(line))
    result.stack = scrubText(frames.join("\n"))
  }

  for (const key of ["code", "status", "statusCode", "digest"]) {
    const value = source[key]
    if (typeof value === "string" || typeof value === "number") {
      result[key] = value
    }
  }

  if (source.cause !== undefined && depth < MAX_CAUSE_DEPTH) {
    result.cause = serializeError(source.cause, depth + 1)
  }

  return result
}

const REDACTED_FIELDS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "access_token",
  "refresh_token",
  "id_token",
  "secret",
  "clientSecret",
  "client_secret",
  "apiKey",
  "api_key",
  "email",
  "authorization",
  "cookie",
]

/** Paths for pino's `redact` option: the fields above, at the top level and one level down. */
export const REDACTED_PATHS = REDACTED_FIELDS.flatMap((key) => [
  key,
  `*.${key}`,
])
