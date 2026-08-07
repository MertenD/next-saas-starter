import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query"
import superjson from "superjson"

/**
 * Factory for a React Query `QueryClient` configured for this app: superjson
 * (de)serialization for dehydrate/hydrate (so `Date`, `Map`, etc. survive
 * server -> client hydration), offline-first network mode for queries so
 * cached data renders immediately, and pending queries are dehydrated too
 * (so a Server Component's in-flight prefetch can be streamed to the client
 * rather than only completed ones). Always go through this factory (via
 * `src/trpc/client.tsx` or `src/trpc/server.tsx`) rather than constructing a
 * `QueryClient` directly, to keep client/server config in sync.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 7 * 24 * 60 * 60 * 1000,
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "always",
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  })
}
