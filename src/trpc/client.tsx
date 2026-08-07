"use client"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import { useState } from "react"
import superjson from "superjson"
import { makeQueryClient } from "./query-client"
import type { AppRouter } from "./routers/_app"

/**
 * `useTRPC()` is the hook client components use to get type-safe query/
 * mutation options for `useQuery`/`useMutation` (TanStack React Query),
 * e.g. `useQuery(useTRPC().posts.list.queryOptions())`.
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient
// On the server we want a fresh QueryClient per request (no shared state
// between users); in the browser we want exactly one client for the whole
// session so cached data survives across navigations.
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return ""
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return "http://localhost:3000"
  })()
  return `${base}/api/trpc`
}

// IndexedDB-backed persister so React Query's cache survives page reloads
// (offline-first UX). Falls back to a no-op persister during SSR, where
// `window`/IndexedDB don't exist.
const noopPersister = {
  persistClient: async () => {},
  restoreClient: async () => undefined as never,
  removeClient: async () => {},
}

const idbPersister =
  typeof window !== "undefined"
    ? createAsyncStoragePersister({
        storage: {
          getItem: async (key: string) => {
            const { get } = await import("idb-keyval")
            return (await get<string>(key)) ?? null
          },
          setItem: async (key: string, value: string) => {
            const { set } = await import("idb-keyval")
            await set(key, value)
          },
          removeItem: async (key: string) => {
            const { del } = await import("idb-keyval")
            await del(key)
          },
        },
      })
    : noopPersister

const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000

/**
 * Root client-side provider wiring up the tRPC client, React Query, and
 * IndexedDB cache persistence. Mount once near the app root (see
 * `src/app/layout.tsx`); everything under it can call `useTRPC()`.
 */
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    }),
  )
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: PERSIST_MAX_AGE }}
    >
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </PersistQueryClientProvider>
  )
}
