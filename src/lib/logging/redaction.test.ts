import pino from "pino"
import { describe, expect, test } from "vitest"
import { REDACTED_PATHS, scrubText, serializeError } from "./redaction"

// All values are made up. `SECRET` marks what must never reach the logs.

describe("scrubText", () => {
  test.each([
    // Email addresses
    "User SECRET@example.test not found",
    "GET https://api.test/customers?q=SECRET%40example.test failed",
    "redirect=https%3A%2F%2Fa.test%2F%3Fq%3DSECRET%2540example.test",
    // name=value
    "https://api.test/me?token=SECRET123",
    "https://api.test/me?access_token=SECRET123&x=1",
    "https://api.test/t?refresh_token=SECRET123",
    "https://api.test/x?api_key=SECRET123",
    "https://api.test/x?apiKey=SECRET123",
    "https://api.test/x?id_token=SECRET.abc-def_ghi",
    "grant_type=refresh_token&client_secret=SECRET123",
    "access_token=SECRET123 expired",
    "callback=https%3A%2F%2Fa.test%2F%3Ftoken%3DSECRET123%26x%3D1",
    "https://a.test/cb?code=SECRET123",
    "https://a.test/cb#state=SECRET123",
    // JSON and printed objects
    '{"token":"SECRET123"}',
    '{"access_token": "SECRET123", "a": 1}',
    '{"password":"pa\\"ss SECRET123"}',
    "{ clientSecret: 'SECRET123' }",
    '{"body":"{\\"refresh_token\\":\\"SECRET123\\"}"}',
    // Paths, headers, connection strings
    "POST /api/auth/reset-password/SECRET123",
    "Authorization: Bearer SECRET123",
    "postgres://user:SECRET123@db:5432/app",
  ])("removes the secret from %s", (input) => {
    expect(scrubText(input)).not.toContain("SECRET")
  })

  test.each([
    "deploy user@localhost failed",
    "Cannot find package react@experimental",
    "Argument `title` is missing.",
    "Invalid token",
    "Token expired: please sign in again",
    "totalTokens=1534 exceeds the limit",
    '{"completion_tokens": 42}',
    "error code=P2025 state=idle",
    "Missing field password",
    "https://api.test/list?page=2&sort=name",
  ])("leaves harmless text unchanged: %s", (input) => {
    expect(scrubText(input)).toBe(input)
  })

  test("keeps the rest of the text readable", () => {
    expect(
      scrubText('GET /me?access_token=abc&x=1 {"apiKey":"abc","n":1}'),
    ).toBe('GET /me?access_token=[redacted]&x=1 {"apiKey":"[redacted]","n":1}')
  })

  test("stays fast on long text without a match", () => {
    const hostile = `${"a".repeat(20_000)} ${'token":"'.repeat(2000)} ${"x%40".repeat(3000)}`
    const startedAt = performance.now()
    scrubText(hostile)
    // About 10 ms. The generous limit only catches quadratic rules (> 1 s)
    expect(performance.now() - startedAt).toBeLessThan(500)
  })
})

describe("serializeError", () => {
  test("writes only allowed properties", () => {
    const error = Object.assign(new Error("Request failed"), {
      statusCode: 422,
      body: "SECRET-BODY",
      headers: { authorization: "Bearer SECRET-HEADER" },
      requestBodyValues: { prompt: "SECRET-PROMPT" },
    })

    const result = serializeError(error)

    expect(Object.keys(result).sort()).toEqual([
      "message",
      "stack",
      "statusCode",
      "type",
    ])
    expect(JSON.stringify(result)).not.toContain("SECRET")
  })

  test("scrubs the message, the stack and the cause chain", () => {
    const error = new Error("User SECRET@example.test exists", {
      cause: new Error("postgres://user:SECRET@db:5432/app refused"),
    })

    const result = serializeError(error)

    expect(result.message).toBe("User [email] exists")
    expect(JSON.stringify(result)).not.toContain("SECRET")
    expect(result.stack).toMatch(/^\s+at /)
  })

  test("drops the query values from Prisma validation errors", () => {
    const error = new Error(
      'Invalid `prisma.post.create()` invocation:\n\n{\n  data: { content: "SECRET" }\n}\n\nArgument `title` is missing.',
    )
    error.name = "PrismaClientValidationError"

    const result = serializeError(error)

    expect(result.message).toBe("Argument `title` is missing.")
    expect(JSON.stringify(result)).not.toContain("SECRET")
  })

  test("handles values that are not errors", () => {
    expect(serializeError("mail SECRET@example.test")).toEqual({
      message: "mail [email]",
    })
  })

  test("stops following causes after a few levels", () => {
    const error: Error & { cause?: unknown } = new Error("loop")
    error.cause = error

    expect(() => JSON.stringify(serializeError(error))).not.toThrow()
  })
})

describe("REDACTED_PATHS", () => {
  test("redacts the fields at the top level and one level down", () => {
    const lines: string[] = []
    const log = pino(
      { redact: { paths: REDACTED_PATHS, censor: "[redacted]" } },
      { write: (line: string) => lines.push(line) },
    )

    log.info({
      accessToken: "SECRET",
      email: "SECRET",
      nested: { api_key: "SECRET", client_secret: "SECRET" },
    })

    expect(lines).toHaveLength(1)
    expect(lines[0]).not.toContain("SECRET")
  })
})
