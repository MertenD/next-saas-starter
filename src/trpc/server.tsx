import "server-only"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from "@trpc/tanstack-react-query"
import type React from "react"
import { cache } from "react"
import { createTRPCContext } from "./init"
import { makeQueryClient } from "./query-client"
import { appRouter } from "./routers/_app"

/** One QueryClient per request, cached via React's `cache()`. */
export const getQueryClient = cache(makeQueryClient)

/**
 * Server-side tRPC "options proxy": lets Server Components build the same
 * query options object client components would get from `useTRPC()` (e.g.
 * `trpc.posts.list.queryOptions()`), for use with {@link prefetch}.
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

/**
 * Direct server-side caller for invoking procedures like plain async
 * functions (no HTTP round-trip) - useful in Server Components, Server
 * Actions, or route handlers that just need the data, not React Query
 * caching.
 */
export const caller = appRouter.createCaller(createTRPCContext)

/**
 * Prefetches a query (or infinite query) into the request-scoped
 * QueryClient from a Server Component, so {@link HydrateClient} can hand the
 * already-fetched data to the client tree and avoid a client-side waterfall.
 */
// biome-ignore lint/suspicious/noExplicitAny: required for generic tRPC query options
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === "infinite") {
    return queryClient.prefetchInfiniteQuery(queryOptions as never)
  }
  return queryClient.prefetchQuery(queryOptions)
}

/**
 * Dehydrates the request-scoped QueryClient (populated via {@link prefetch})
 * and rehydrates it on the client. Wrap a Server Component subtree with this
 * whenever it prefetches data that a descendant client component will read
 * via `useQuery`/`useSuspenseQuery`.
 */
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}
