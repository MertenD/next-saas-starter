import { polarClient } from "@polar-sh/better-auth"
import { inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "./auth"

/**
 * The browser-side Better Auth client. Provides the React hooks/methods
 * (`authClient.signIn`, `authClient.useSession`, `authClient.checkout`, ...)
 * used by client components under `src/features/auth` and
 * `src/features/settings`. Talks to the server instance in `src/lib/auth.ts`
 * through the catch-all API route.
 */
export const authClient = createAuthClient({
  plugins: [polarClient(), inferAdditionalFields<typeof auth>()],
})
