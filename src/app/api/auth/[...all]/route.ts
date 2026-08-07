import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"

/**
 * Catch-all route for every Better Auth endpoint (sign-in, sign-up, OAuth
 * callbacks, session, Polar checkout/portal, ...). `authClient` (the
 * browser SDK) talks to this route; there's normally no need to add routes
 * here manually when adding a new auth feature - configure it on the
 * `auth` instance in `src/lib/auth.ts` instead.
 */
export const { GET, POST } = toNextJsHandler(auth)
