import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Unit tests (`bun run test`), `*.test.ts` files next to the code under `src/`.
 * The tests run in a Node environment. For React component tests add a DOM
 * environment and the React plugin, see
 * `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`.
 */
export default defineConfig({
  resolve: {
    // The same alias as in tsconfig.json
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
