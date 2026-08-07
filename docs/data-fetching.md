# Data Fetching

Every query and mutation in this app goes through tRPC + TanStack Query, but there are two different places to call them from: **client components** (`useTRPC()`) and **Server Components** (`prefetch()` + `HydrateClient`, or the direct `caller`). Both paths end up on the same TanStack Query cache and the same `queryOptions()`, so they compose - a Server Component can prefetch data that a client component then reads with zero loading flash.

This page walks through both, step by step, using the `posts` demo (`src/features/demo/posts/`) as the running example.

## Client-side: `useQuery` / `useMutation`

This is the default, and what every existing demo feature uses today.

**Step 1 - get the typed client hook.**

```tsx
"use client"

import { useTRPC } from "@/trpc/client"

const trpc = useTRPC()
```

`useTRPC()` (from `src/trpc/client.tsx`) gives you a fully-typed proxy of the whole `appRouter` - `trpc.posts.getMany`, `trpc.posts.create`, etc. It only works in a `"use client"` component, since it reads React context set up by `TRPCReactProvider` in `src/app/layout.tsx`.

**Step 2 - turn a procedure into query options and pass them to `useQuery`.**

```ts
// src/features/demo/posts/hooks/use-posts.ts
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export const usePosts = () => {
  const trpc = useTRPC()
  return useQuery(trpc.posts.getMany.queryOptions())
}
```

`trpc.posts.getMany.queryOptions()` builds the `{ queryKey, queryFn }` object TanStack Query needs - the query key is derived automatically from the procedure path and input, so you never hand-write cache keys.

**Step 3 - implement all four UI states in the component.**

```tsx
// src/features/demo/posts/components/posts-container.tsx
"use client"

import { usePosts } from "@/features/demo/posts/hooks/use-posts"

export function PostsContainer() {
  const { data: posts, isLoading, isError } = usePosts()

  if (isLoading) return <PostsSkeleton />
  if (isError) return <ErrorState /* wire to refetch() if you want a retry button */ />
  if (!posts || posts.length === 0) return <EmptyState />
  return <PostsList posts={posts} />
}
```

See [Frontend](./frontend.md#ui-states---every-fetch-needs-all-four) for the full loading/empty/error/content rules - they apply here regardless of which fetching path you use.

**Step 4 - mutations invalidate the query they affect.**

```ts
// src/features/demo/posts/hooks/use-posts.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useCreatePost = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  return useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions())
      },
    }),
  )
}
```

Because `invalidateQueries` is passed the same `queryOptions()` object, TanStack Query matches it against the exact query key `usePosts()` is subscribed to and refetches it - no manually-typed query keys to keep in sync.

## Server-side: `prefetch()` + `HydrateClient`

Use this when a page already knows what data it needs at request time and you want that data to arrive in the initial HTML - no client-side loading spinner on first paint, no request waterfall (client mounts, then fetches).

**Step 1 - call `prefetch()` in the Server Component (`page.tsx`).**

```tsx
// src/app/(dashboard)/demo/posts/page.tsx
import { prefetch, trpc } from "@/trpc/server"
import { PostsContainer } from "@/features/demo/posts/components/posts-container"

export default async function PostsPage() {
  prefetch(trpc.posts.getMany.queryOptions())

  return (
    <main className="flex flex-col gap-6 p-6">
      <PostsContainer />
    </main>
  )
}
```

`trpc` here is the server-side "options proxy" from `src/trpc/server.tsx` - it builds the exact same `queryOptions()` shape as the client `useTRPC()` does, just without needing React context. `prefetch()` runs the query against a request-scoped `QueryClient` (via `getQueryClient()`, cached per-request with React's `cache()`) and stores the result in its cache. Note it's **not awaited** - `prefetchQuery` populates the cache and lets Next.js's streaming SSR pick up the promise, so the page doesn't block on it.

**Step 2 - make sure the tree is wrapped in `HydrateClient`.**

```tsx
// src/app/(dashboard)/layout.tsx
import { HydrateClient } from "@/trpc/server"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  return (
    <HydrateClient>
      <AppShell username={session.user.name}>{children}</AppShell>
    </HydrateClient>
  )
}
```

This is already done once, at the top of the `(dashboard)` route group - every page under it (including `PostsPage` above) is covered automatically. You only need your own `<HydrateClient>` if you're prefetching from a route outside `(dashboard)`. `HydrateClient` calls `dehydrate()` on the request-scoped `QueryClient` and serializes its cache (via superjson, so `Date`s etc. survive) into the HTML as part of a `HydrationBoundary`.

**Step 3 - read the same query from a client component with `useSuspenseQuery`.**

```tsx
// src/features/demo/posts/components/posts-container.tsx
"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function PostsContainer() {
  const trpc = useTRPC()
  const { data: posts } = useSuspenseQuery(trpc.posts.getMany.queryOptions())

  if (posts.length === 0) return <EmptyState />
  return <PostsList posts={posts} />
}
```

On mount, `TRPCReactProvider`'s client-side `QueryClient` picks up the dehydrated cache from the `HydrationBoundary` and rehydrates it. Since `useSuspenseQuery` is called with the *exact same* `queryOptions()` (same query key) as the server-side `prefetch()`, it finds the data already sitting in the cache - it resolves synchronously instead of firing a new request, so there's no loading state to render on first load. Wrap it in `<Suspense>` regardless (`<Suspense fallback={<PostsSkeleton />}><PostsContainer /></Suspense>`), so a client-side navigation to this route without a fresh prefetch still degrades to a real loading state instead of relying on data that may not be there.

One trade-off: `useSuspenseQuery` throws errors up to the nearest error boundary rather than giving you an `isError` flag inline, so the "Error" UI state has to be handled with a Next.js `error.tsx` (which gets a `reset()` function you can wire to a "Try again" button) instead of the inline pattern from the client-only example above.

**Step 4 - mutations work exactly the same afterward.**

Once hydrated, it's the same client-side `QueryClient` as the pure client-side path - `useCreatePost()`'s `invalidateQueries(trpc.posts.getMany.queryOptions())` from step 4 above still matches and refetches correctly. Prefetching only changes how the *first* render gets its data, not how later interactions work.

## Server-side: calling a procedure directly with `caller`

For a Server Action, a Route Handler, or a Server Component that renders data once and never needs client-side interactivity (no refetching, no mutations), skip the query-cache machinery entirely and call the procedure like a plain async function:

```ts
import { caller } from "@/trpc/server"

const posts = await caller.posts.getMany()
```

`caller` (`appRouter.createCaller(createTRPCContext)`) runs the procedure directly - no HTTP round-trip, no TanStack Query cache, no hydration. Use this instead of `prefetch()` when the calling component is a Server Component all the way down and nothing beneath it needs to read the same data via `useQuery`.

## Which one do I use?

| Scenario | Use |
|---|---|
| Interactive data a client component owns (tables, forms, anything with loading/refetch/mutate) | Client-side `useQuery`/`useMutation` (first section) |
| Page-level data you want present in the initial HTML, read by a client component that also needs to mutate/refetch it later | `prefetch()` + `HydrateClient` + `useSuspenseQuery` |
| One-off read in a Server Action, Route Handler, or a Server Component with no client interactivity | `caller` |

## See also

- [Architecture](./architecture.md) - request flow, tRPC procedure types, project structure.
- [Features](./features.md) - the feature-module pattern; every feature's `hooks/` folder wraps its router this way.
- [Frontend](./frontend.md) - the four required UI states, confirm dialogs.
- [Quick Reference](./quick-reference.md) - one-line lookup for every export mentioned above.
