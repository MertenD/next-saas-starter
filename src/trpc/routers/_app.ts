import { adminRouter } from "@/features/admin/server/router"
import { bookingRouter } from "@/features/demo/booking/server/router"
import { demoRouter } from "@/features/demo/inngest/server/router"
import { paginationRouter } from "@/features/demo/pagination/server/router"
import { postsRouter } from "@/features/demo/posts/server/router"
import { privacyRouter } from "@/features/privacy/server/router"
import { userRouter } from "@/features/user/server/router"
import { createTRPCRouter } from "../init"

/**
 * Root tRPC router: merges every feature's router (each defined in that
 * feature's `server/router.ts`) under its own namespace. Register a new
 * feature router here to expose it to the client - see
 * `docs/features.md` for the full feature-module walkthrough.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  posts: postsRouter,
  privacy: privacyRouter,
  user: userRouter,
  demo: demoRouter,
  pagination: paginationRouter,
  booking: bookingRouter,
})

/** Type-only export consumed by the client (`src/trpc/client.tsx`) for end-to-end type safety. */
export type AppRouter = typeof appRouter
