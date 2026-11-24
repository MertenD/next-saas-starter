import type { inferInput } from "@trpc/tanstack-react-query"
import { prefetch, trpc } from "@/trpc/server"

/** Prefetches the admin users list so the table renders without a loading flash. */
export const prefetchAdminUsers = (
  params: inferInput<typeof trpc.admin.users>,
) => prefetch(trpc.admin.users.queryOptions(params))

/** Prefetches the admin overview numbers. */
export const prefetchAdminStats = () =>
  prefetch(trpc.admin.stats.queryOptions())
