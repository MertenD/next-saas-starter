import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@/trpc/routers/_app"

/** One row of the admin users table (`trpc.admin.users`). */
export type AdminUser =
  inferRouterOutputs<AppRouter>["admin"]["users"]["items"][number]
