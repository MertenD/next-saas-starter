# Data Fetching

Every query and mutation in this app goes through tRPC + TanStack Query, but there are two different places to call them from: **client components** (`useTRPC()`) and **Server Components** (`prefetch()` + `HydrateClient`, or the direct `caller`). Both paths end up on the same TanStack Query cache and the same `queryOptions()`, so they compose - a Server Component can prefetch data that a client component then reads with zero loading flash.

This page walks through both, step by step, using the `posts` demo (`src/features/demo/posts/`) as the running example.

**In short - which pattern for which page:**

- Data behind a click or inside a form/dialog: client-side `useQuery`, no prefetch.
- Page data that should be in the first HTML and loads **fast**: `await prefetch()` + `useQuery` ([Variant A](#variant-a-await-prefetch-usequery-the-default), the default, used by every page today).
- Page data that loads **slowly** next to content that should not wait: `prefetch()` without `await` + `useSuspenseQuery` in `<Suspense>` ([Variant B](#variant-b-prefetch-without-await-usesuspensequery-in-suspense-streaming)).
- A not-awaited `prefetch()` with plain `useQuery` is a bug (hydration error), see [the one rule](#the-one-rule-never-mix-a-not-awaited-prefetch-with-usequery).

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
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter())
      },
    }),
  )
}
```

Because `queryFilter()` is derived from the same procedure, TanStack Query matches it against the exact query key `usePosts()` is subscribed to and refetches it - no manually-typed query keys to keep in sync.

## Server-side: `prefetch()` + `HydrateClient`

Use this when a page already knows what data it needs at request time and you want that data on its way to the browser with the page - no request waterfall (HTML, then JS, then hydration, and only then the client starts fetching).

There are **two variants**. They share the same two building blocks (`prefetch()` and `HydrateClient`, below) and differ in one thing: whether the page waits for the data (`await`) or streams it in later (`<Suspense>`). Read [Which variant do I use?](#which-variant-do-i-use) before you pick one.

### The building blocks

**1 - call `prefetch()` in the Server Component (`page.tsx`).**

`trpc` here is the server-side "options proxy" from `src/trpc/server.tsx` - it builds the exact same `queryOptions()` shape as the client `useTRPC()` does, just without needing React context. `prefetch()` runs the query against a request-scoped `QueryClient` (via `getQueryClient()`, cached per-request with React's `cache()`) and stores the result in its cache.

**2 - wrap the client subtree in `HydrateClient`, in the same page that prefetches.**

`HydrateClient` calls `dehydrate()` on the request-scoped `QueryClient` and serializes its cache (via superjson, so `Date`s etc. survive) into the HTML as part of a `HydrationBoundary`. On the client, `TRPCReactProvider`'s `QueryClient` picks that cache up, so a query with the *exact same* `queryOptions()` (same query key) finds its data already there instead of firing a request.

Every page that calls `prefetch()` needs its own `HydrateClient` **below** the `prefetch()` call. The one in `src/app/(dashboard)/layout.tsx` runs earlier in the render, before the page has prefetched anything, so it can't carry the page's data.

### Variant A: `await prefetch()` + `useQuery` (the default)

The page waits for the data. The server HTML already contains the finished content, and the client hydrates to exactly the same markup.

```tsx
// src/app/(dashboard)/demo/posts/page.tsx (this is the real page)
import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { PostsContainer } from "@/features/demo/posts/components/posts-container"
import { requireAuth } from "@/lib/auth-utils"

export default async function PostsPage() {
  await requireAuth()
  await prefetch(trpc.posts.getMany.queryOptions())

  return (
    <div className="flex flex-col gap-6 p-6">
      <HydrateClient>
        <PostsContainer />
      </HydrateClient>
    </div>
  )
}
```

```tsx
// src/features/demo/posts/components/posts-container.tsx (client component, the real one)
"use client"

export function PostsContainer() {
  const { data: posts, isLoading, isError } = usePosts() // plain useQuery

  if (isLoading) return <PostsSkeleton /> // only if there is no cached data
  if (isError) return <ErrorState /> // inline, with a retry button
  if (!posts || posts.length === 0) return <EmptyState />
  return <PostsList posts={posts} />
}
```

- While the awaited query runs, Next.js shows the route's `loading.tsx` skeleton (`src/app/(dashboard)/loading.tsx`).
- All four UI states live **inside the component** (`isLoading`, `isError`, empty, content), exactly as in the client-only path.
- `useQuery` options such as `placeholderData: keepPreviousData` or `enabled` keep working. The [Pagination demo](./demos/pagination.md) needs `keepPreviousData` for its page switches and therefore uses this variant.
- This is what every page in the app uses today (Posts, Settings, Pagination).

### Variant B: `prefetch()` without `await` + `useSuspenseQuery` in `<Suspense>` (streaming)

The page does **not** wait. The rest of the page renders and is sent immediately; only the part that needs the data is replaced by a skeleton and then streamed in, in the same response, once the query finishes.

No page in the repo uses this variant yet, so treat the snippet as the pattern to copy (the `reports` feature is made up):

```tsx
// src/app/(dashboard)/reports/page.tsx - no await
import { Suspense } from "react"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { ReportsList } from "@/features/reports/components/reports-list"
import { ReportsSkeleton } from "@/features/reports/components/reports-skeleton"

export default async function ReportsPage() {
  prefetch(trpc.reports.getAll.queryOptions()) // slow query, not awaited

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1>Reports</h1> {/* visible immediately */}
      <HydrateClient>
        <Suspense fallback={<ReportsSkeleton />}>
          <ReportsList /> {/* streams in later */}
        </Suspense>
      </HydrateClient>
    </div>
  )
}
```

```tsx
// src/features/reports/components/reports-list.tsx
"use client"

export function ReportsList() {
  const trpc = useTRPC()
  const { data: reports } = useSuspenseQuery(trpc.reports.getAll.queryOptions())

  if (reports.length === 0) return <EmptyState />
  return <List reports={reports} />
}
```

- **Loading** is the `<Suspense fallback>` (not `isLoading`, which `useSuspenseQuery` does not return).
- **Error** is not inline either: `useSuspenseQuery` throws, so the nearest error boundary handles it. For a whole route that is `error.tsx` (this Next.js version passes `retry`, not `reset`, see `src/app/(dashboard)/error.tsx`); for a single section, wrap the `<Suspense>` in an `ErrorBoundary`.
- **Empty and content** are the only states left in the component.
- `useSuspenseQuery` does not support `placeholderData`/`keepPreviousData` and `enabled`.

### The one rule: never mix a not-awaited prefetch with `useQuery`

| `prefetch()` | Client hook | Result |
|---|---|---|
| `await` | `useQuery` | works (Variant A) |
| `await` | `useSuspenseQuery` | works, the Suspense fallback is simply never shown |
| no `await` | `useSuspenseQuery` in `<Suspense>` | works (Variant B) |
| no `await` | `useQuery` | **hydration error** |

The last row breaks because the query is still pending when the server renders, so the server HTML contains the loading skeleton. The client, however, already received the streamed result and hydrates with data, so it renders the table instead of the skeleton: *"Hydration failed because the server rendered HTML didn't match the client."*

### Which variant do I use?

Ask in this order:

1. **Do you need `keepPreviousData` or `enabled`, or do you want inline `isPending`/`isError` states?** Use **Variant A**.
2. **Is the query fast** (roughly under 200 to 300 ms: an indexed database read of your own data, the current user)? Use **Variant A**. The wait is barely noticeable and the code is simpler.
3. **Is the query slow or unpredictable** (an external API, a heavy aggregation, seconds) **and does the page have other content that should not wait?** Use **Variant B**, with only the data-dependent part inside `<Suspense>`.
4. **Unsure?** Variant A. It is the robust default: the page is complete when it arrives, there is no flash of loading state, and all four UI states stay inline in one component.

Rule of thumb: *await when the wait is short or the page is useless without the data; stream when the wait is long and the rest of the page is useful on its own.*

| | Variant A: `await` + `useQuery` | Variant B: no `await` + `useSuspenseQuery` |
|---|---|---|
| Page content arrives | all at once, after the query | shell first, data part streams in |
| Loading state | route `loading.tsx` | `<Suspense fallback>` around the part |
| Error state | inline (`isError`, retry button) | error boundary (`error.tsx`/`ErrorBoundary`) |
| `keepPreviousData`, `enabled` | supported | not supported |
| Best for | fast queries, list pages with URL state | slow queries next to other content |
| In this repo | Posts, Settings, Pagination | pattern only, no page yet |

### Mutations work exactly the same afterward

Once hydrated, it's the same client-side `QueryClient` as the pure client-side path - `useCreatePost()`'s `invalidateQueries(trpc.posts.getMany.queryFilter())` from the client-side section still matches and refetches correctly. Prefetching only changes how the *first* render gets its data, not how later interactions work.

## Server-side: calling a procedure directly with `caller`

For a Server Action, a Route Handler, or a Server Component that renders data once and never needs client-side interactivity (no refetching, no mutations), skip the query-cache machinery entirely and call the procedure like a plain async function:

```ts
import { caller } from "@/trpc/server"

const posts = await caller.posts.getMany()
```

`caller` (`appRouter.createCaller(createTRPCContext)`) runs the procedure directly - no HTTP round-trip, no TanStack Query cache, no hydration. Use this instead of `prefetch()` when the calling component is a Server Component all the way down and nothing beneath it needs to read the same data via `useQuery`.

### A complete list-page example

The [Pagination demo](./demos/pagination.md) wires Variant A together for a URL-driven list: `createLoader` parses `searchParams` on the server, `await prefetch()` loads the first page, `HydrateClient` ships it, and the client `useQuery` (same `queryOptions()`) finds it already in the cache. Use it as the template for new list pages.

## Which one do I use?

| Scenario | Use |
|---|---|
| Interactive data a client component owns, nothing needs to be in the first HTML (forms, dialogs, data behind a click) | Client-side `useQuery`/`useMutation` only, no prefetch |
| Page-level data that should be in the initial HTML, **fast** query, inline loading/error/empty states, or `keepPreviousData` | `await prefetch()` + `HydrateClient` + `useQuery` (**Variant A**) |
| Page-level data from a **slow** query, with other page content that should not wait | `prefetch()` (no `await`) + `HydrateClient` + `useSuspenseQuery` in `<Suspense>` (**Variant B**) |
| One-off read in a Server Action, Route Handler, or a Server Component with no client interactivity | `caller` |

## See also

- [Architecture](./architecture.md) - request flow, tRPC procedure types, project structure.
- [Features](./features.md) - the feature-module pattern; every feature's `hooks/` folder wraps its router this way.
- [Frontend](./frontend.md) - the four required UI states, confirm dialogs.
- [Quick Reference](./quick-reference.md) - one-line lookup for every export mentioned above.
