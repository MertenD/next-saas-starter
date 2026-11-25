import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import {
  cleanupExpiredAuthData,
  demoJob,
  onUserSignedUp,
} from "@/inngest/functions"

/**
 * Inngest's serve handler: this is the endpoint the Inngest dev
 * server/runner invokes to discover and execute registered functions. Every
 * function created in `src/inngest/functions.ts` must be listed in the
 * `functions` array below or it won't run.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onUserSignedUp, demoJob, cleanupExpiredAuthData],
})
