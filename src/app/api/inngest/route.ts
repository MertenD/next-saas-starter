import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import {
  cleanupExpiredAuthData,
  demoJob,
  onUserSignedUp,
} from "@/inngest/functions"
import { withRequestLogging } from "@/lib/logging/request-logging"

/**
 * Inngest's serve handler: this is the endpoint the Inngest dev
 * server/runner invokes to discover and execute registered functions. Every
 * function created in `src/inngest/functions.ts` must be listed in the
 * `functions` array below or it won't run.
 */
const handlers = serve({
  client: inngest,
  functions: [onUserSignedUp, demoJob, cleanupExpiredAuthData],
})

export const GET = withRequestLogging(handlers.GET)
export const POST = withRequestLogging(handlers.POST)
export const PUT = withRequestLogging(handlers.PUT)
