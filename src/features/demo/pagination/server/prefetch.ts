import type { inferInput } from "@trpc/tanstack-react-query"
import { prefetch, trpc } from "@/trpc/server"

type PrefetchCustomersInput = inferInput<typeof trpc.pagination.getMany>

/** Prefetches the customers list on the server so the client renders it without a loading flash. */
export const prefetchCustomers = (params: PrefetchCustomersInput) => {
  return prefetch(trpc.pagination.getMany.queryOptions(params))
}
