# Testing

Unit tests run with [Vitest](https://vitest.dev). So far they only cover the log filters in `src/lib/logging/` (see [Logging](./logging.md#keeping-personal-data-and-secrets-out)). They are a starting point, not a full test suite.

## Running the tests

```bash
bun run test          # run once, as in CI
bun run test:watch    # re-run on changes
```

Use `bun run test`, **not** `bun test`: the second one starts Bun's own test runner instead of Vitest.

CI (`.github/workflows/ci.yml`) runs `bun run test` on every push to `main` and every pull request, after the typecheck and before the build. A failing test stops the run.

## Writing a test

Put the test next to the code as `<name>.test.ts`. Files matching `src/**/*.test.{ts,tsx}` are picked up. Import everything from `vitest`, there are no global `test` or `expect`:

```ts
import { describe, expect, test } from "vitest"
import { scrubText } from "@/lib/logging/redaction"

describe("scrubText", () => {
  test("removes email addresses", () => {
    expect(scrubText("User jane@example.test")).toBe("User [email]")
  })
})
```

Use made-up data only, never real names, addresses or secrets. Modules that import `@/config/env` validate the environment as soon as they are imported, so keep logic you want to test in modules that do not need it, or set the variables in the test setup.

## Configuration

[`vitest.config.mts`](https://github.com/MertenD/next-saas-starter/blob/main/vitest.config.mts) sets the `@/` alias (the same as in `tsconfig.json`, keep both in sync) and a Node environment.

### Why the scripts use `bun --bun`

The scripts run Vitest on the Bun runtime (`bun --bun vitest`). On a machine where Node and Bun have different CPU architectures (seen on Windows ARM with an x64 Node), `bun install` only fetches the native binding of Vite for Bun's architecture, and Vitest cannot start under Node. Vitest is mainly built for Node, so if a Vitest feature misbehaves under Bun, check it under Node. If Node and Bun have the same architecture on all your machines, you can change the scripts to `vitest run` and `vitest`. CI then needs a Node version that Vitest supports (`actions/setup-node`).

Tools that start Vitest with Node themselves, such as an IDE test runner, can hit the same startup error on such a machine.

## Not set up yet

- **React components and hooks:** needs a DOM environment (`jsdom` or `happy-dom`), the Testing Library and `@vitejs/plugin-react`. Next.js ships a guide in `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`.
- **`async` Server Components:** Vitest does not support them (per that guide). Cover those pages with end-to-end tests.
- **End-to-end tests** (for example Playwright) and **tests against a real database**.
- **Coverage reports:** need an extra package such as `@vitest/coverage-v8`.
