import { realtimeMiddleware } from "@inngest/realtime/middleware"
import { Inngest } from "inngest"
import { env } from "@/config/env"

/**
 * Shared Inngest client used to define functions (`src/inngest/functions.ts`)
 * and send events (`inngest.send(...)`) from anywhere in the app (server
 * actions, tRPC procedures, auth hooks, ...). The `realtimeMiddleware` plugin
 * enables `publish()` inside functions for live progress updates, see
 * `src/inngest/realtime.ts`.
 */
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  middleware: [realtimeMiddleware()],
  // No explicit `isDev`: the SDK infers the mode from NODE_ENV. Development
  // talks to the unauthenticated dev server on localhost:8288. Production
  // (also `next start`) runs signed: INNGEST_EVENT_KEY signs events sent to
  // the self-hosted server and INNGEST_SIGNING_KEY verifies that calls to
  // /api/inngest really come from it. The server host is INNGEST_BASE_URL
  // (see docker-compose.prod.yml). Both keys are validated in src/config/env.ts.
})
