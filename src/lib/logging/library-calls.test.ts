import pino from "pino"
import { describe, expect, test } from "vitest"
import { logLibraryCall } from "./library-calls"
import { serializeError } from "./redaction"

/** Forwards one library call and returns the written line. */
function forward(...args: unknown[]) {
  const lines: string[] = []
  const log = pino(
    { base: undefined, serializers: { err: serializeError } },
    { write: (line: string) => lines.push(line) },
  )
  logLibraryCall(log, "info", args)
  return JSON.parse(lines[0] ?? "{}") as Record<string, unknown>
}

describe("logLibraryCall", () => {
  test("keeps numbers, booleans and ids of an object", () => {
    const line = forward({ reportId: "r_1", count: 3, done: true }, "Report")

    expect(line).toMatchObject({
      msg: "Report",
      reportId: "r_1",
      count: 3,
      done: true,
    })
  })

  test("drops other strings, nested objects and arrays", () => {
    const line = forward("Sign-in failed", {
      email: "SECRET@example.test",
      name: "SECRET",
      nested: { userId: "SECRET" },
      list: ["SECRET"],
    })

    expect(JSON.stringify(line)).not.toContain("SECRET")
  })

  test("scrubs the message and values of id fields", () => {
    const line = forward("No user SECRET@example.test", {
      customerId: "SECRET@example.test",
    })

    expect(line.msg).toBe("No user [email]")
    expect(line.customerId).toBe("[email]")
  })

  test("logs the first error as err, also when it is wrapped", () => {
    const line = forward({ error: new Error("boom") }, "Job failed")

    expect(line.msg).toBe("Job failed")
    expect(line.err).toMatchObject({ message: "boom" })
  })

  test("does not let a library overwrite the logger's own fields", () => {
    const line = forward({ level: 99, time: 1, component: 2 }, "Message")

    expect(line.level).not.toBe(99)
    expect(line.time).not.toBe(1)
    expect(line).not.toHaveProperty("component")
  })
})
