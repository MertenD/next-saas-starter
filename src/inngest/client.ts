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
  // This app only ever talks to a self-hosted Inngest instance (never Inngest
  // Cloud), so force Dev Mode regardless of NODE_ENV. Without this, `next
  // start` / the production Docker image would infer Cloud mode and demand
  // an INNGEST_EVENT_KEY. The target host is INNGEST_BASE_URL (see
  // docker-compose.prod.yml) or the default localhost:8288 dev server.
  isDev: true,
})
