# Quick Reference

A fast lookup table of the utilities, hooks, and helpers already in this codebase - check here before writing a new one. Each entry links to the file that defines it; follow the links in the other docs pages for the full explanation.

## Auth & access guards

Server-side (Server Components, Server Actions) - `src/lib/auth-utils.ts`:

| Export | What it does |
|---|---|
| `requireAuth()` | Redirects to `/login` if there's no session; otherwise returns the session. First statement of every dashboard page (the layout check does not re-run on navigation). |
| `requireAdmin()` | Like `requireAuth`, plus redirects non-admins to `/dashboard`. Use at the top of every page under `/admin`. |
| `requireAuthAndPremium(redirectUrl?)` | Like `requireAuth`, plus redirects if the user has no active Polar subscription. Skipped when Polar isn't configured. |
| `requireUnauth()` | Redirects signed-in users away from auth-only pages (login, signup) back to `/`. |
| `getSessionOnServer()` | Reads the session without redirecting; `null` when unauthenticated. |
| `requirePremiumUserFromRequest(req)` | Route Handler variant of `requireAuthAndPremium` - throws a 401/403 `Response` instead of redirecting. |
| `getEnabledOAuthProviders()` | `src/lib/oauth-providers.ts` - OAuth providers with credentials set. Pass to `LoginForm`/`RegisterForm` so only configured providers get a button. |

Client-side:

| Export | Where | What it does |
|---|---|---|
| `authClient` | `src/lib/auth-client.ts` | Better Auth React client - `signIn`, `signOut`, `useSession`, `checkout`, ... |
| `useCurrentUser()` | `src/features/user/hooks/use-user.ts` | Current user's profile (`trpc.user.me`). |
| `useHasActiveSubscription()` | `src/features/subscriptions/hooks/use-subscription.ts` | Standard client-side premium check; treats everyone as premium when Polar isn't configured. Use for UI gating only, not enforcement. |
| `useSubscription()` | `src/features/subscriptions/hooks/use-subscription.ts` | Raw Polar customer state. Prefer `useHasActiveSubscription` unless you need the raw data. |

tRPC procedure builders (`src/trpc/init.ts`) - see [Architecture](./architecture.md#trpc-procedure-types):

| Export | What it does |
|---|---|
| `baseProcedure` | Public, no auth. |
| `protectedProcedure` | Requires a session, throws `UNAUTHORIZED` otherwise. Attaches `ctx.auth`. |
| `premiumProcedure` | `protectedProcedure` + active subscription check, throws `FORBIDDEN` otherwise. Attaches `ctx.customer`. |
| `getPolarCustomerState(userId)` / `hasActiveSubscription(customer)` | Server-side, `src/lib/auth-utils.ts`. Request-cached Polar customer lookup (`null` when Polar is off) and the active-subscription predicate; used by every server-side premium check. |

## Backend clients & services

| Export | Where | What it does |
|---|---|---|
| `prisma` (default export) | `src/lib/db.ts` | Shared Prisma client. Always import this instead of `new PrismaClient()`. |
| `getRedis()` | `src/lib/redis.ts` | Shared Redis client, connects lazily on first call. |
| `deletePolarCustomer(userId)` / `deleteUserRedisData(userId)` | `src/lib/user-data.ts` | Remove a user's data from Polar (cancels subscriptions) and Redis. Used by account deletion and the admin delete action. Add new external services here. |
| `buildUserDataExport(userId)` | `src/features/privacy/server/export.ts` | Everything stored about a user, for the data export. Add new user data here. |
| `redis` (default export) | `src/lib/redis.ts` | Raw client instance - may not be connected yet, prefer `getRedis()`. |
| `isPolarEnabled` / `polarClient` | `src/lib/polar.ts` | Whether billing is configured, and the Polar SDK client (`null` if not). Check the flag before using the client. |
| `isResendEnabled` / `resendClient` | `src/lib/resend.ts` | Whether transactional email is configured, and the Resend client (`null` if not). |
| `sendEmail({ to, subject, html })` | `src/lib/mailer.ts` | Sends via Resend, falls back to logging the email when Resend isn't configured (full content only outside production). |
| `resetPasswordEmailHtml(...)` / `verifyEmailHtml(...)` | `src/lib/mailer.ts` | Pre-built HTML templates for the two auth emails. |
| `clearPwaPageCache()` | `src/lib/pwa.ts` | Asks the service worker to drop cached pages. Called on sign-out so user-specific pages are not readable offline on shared devices. |
| `useSignOut()` | `src/features/auth/hooks/use-sign-out.ts` | The one sign-out flow: ends the session, clears the PWA page cache, the React Query cache and its IndexedDB copy, then redirects to `/login`. Never call `authClient.signOut` directly. |
| `clearPersistedQueryCache()` | `src/trpc/client.tsx` | Removes the IndexedDB-persisted React Query cache. Used by `useSignOut()`. |
| `openrouter` / `AI_MODEL` | `src/lib/ai.ts` | Shared Vercel AI SDK provider and default chat model id, for `streamText`/`generateText`. |
| `getStreamContext()` | `src/lib/stream-context.ts` | Shared resumable-stream context for resumable AI chat responses. |
| `createLogger(component)` | `src/lib/logging/logger.ts` | The logger for server code, instead of `console`. See [Logging](./logging.md). |
| `setLogUserId(userId)` | `src/lib/logging/context.ts` | Add the user id to the request's log lines. |
| `scrubText(text)` | `src/lib/logging/redaction.ts` | Strip emails, tokens and credentials from free text. |
| `withRequestLogging(handler)` | `src/lib/logging/request-logging.ts` | Wrap every Route Handler: request id on all its log lines plus one access line. |

## tRPC (data fetching)

| Export | Where | What it does |
|---|---|---|
| `useTRPC()` | `src/trpc/client.tsx` | Client components: get query/mutation options for `useQuery`/`useMutation`. |
| `TRPCReactProvider` | `src/trpc/client.tsx` | Root client provider (tRPC + React Query + IndexedDB persistence). Mounted once in `layout.tsx`. |
| `trpc` (options proxy) | `src/trpc/server.tsx` | Server Components: build the same query options as `useTRPC()`, for use with `prefetch`. |
| `caller` | `src/trpc/server.tsx` | Direct server-side procedure calls as plain async functions, no HTTP round-trip. |
| `prefetch(queryOptions)` | `src/trpc/server.tsx` | Prefetches a query into the request-scoped `QueryClient` from a Server Component. `await` it when the client reads the query with `useQuery`; skip the `await` only together with `useSuspenseQuery` in `<Suspense>`. See [Data Fetching](./data-fetching.md#which-variant-do-i-use). |
| `HydrateClient` | `src/trpc/server.tsx` | Wrap a subtree that used `prefetch` so the client tree gets the already-fetched data. |
| `makeQueryClient()` | `src/trpc/query-client.ts` | Factory for a correctly-configured `QueryClient`. Used internally by both providers above - rarely called directly. |

Full walkthrough: [Data Fetching](./data-fetching.md).

## Config

| Export | Where | What it does |
|---|---|---|
| `env` | `src/config/env.ts` | Runtime-validated env vars (Zod). Always import this instead of reading `process.env` directly. |
| `PAGINATION` | `src/config/constants.ts` | Shared pagination defaults/limits (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, ...). |
| `APP_NAME` / `APP_DESCRIPTION` | `src/config/constants.ts` | App-wide display name/description for titles, metadata, emails. |

## UI utilities

| Export | Where | What it does |
|---|---|---|
| `cn(...inputs)` | `src/lib/utils.ts` | Merges Tailwind classes safely (resolves conflicts) via `clsx` + `tailwind-merge`. Use instead of string concatenation. |
| `useErrorMessage()` | `src/hooks/use-error-message.ts` | Returns `(error) => string` for Better Auth/fetch errors, never empty and never technical: 5xx and empty messages map to `common.errors.generic`, other errors keep the server's message. The returned function is stable per locale. Use it for every `toast.error(...)` fed by `authClient`. |
| `useIsMobile()` | `src/hooks/use-mobile.ts` | Live viewport check below the 768px breakpoint (`useSyncExternalStore`). `false` during SSR and hydration - prefer CSS breakpoints unless you need a real JS conditional. |
| `useEntitySearch({ params, setParams })` | `src/hooks/use-entity-search.ts` | Debounced search input state that commits to a URL-backed `search` param and resets to page 1. Pair with `EntitySearch`. `setParams` may change identity every render (the commit runs through `useEffectEvent`), and the input follows the URL when `search` changes from elsewhere. |

## Shared components

Non-`ui/` components in `src/components/` - see [Frontend](./frontend.md) for the full `ui/` primitive list.

| Component | What it does |
|---|---|
| `ConfirmDialog` | Standard "Are you sure?" dialog for ordinary, low-stakes deletes. Never wire a delete straight to a click. |
| `CriticalConfirmDialog` | Destructive/hard-to-reverse deletes - user must retype a confirmation string before confirming. |
| `DashboardProvider` / `useDashboard()` | Server-resolved current user (`id`, `name`, `email`, `image`, `emailVerified`) and `polarEnabled`, provided by the `(dashboard)` layout (`src/components/dashboard-context.tsx`). Use it instead of `authClient.useSession()` or a billing-flag query in dashboard client components. |
| `AppShell` | Dashboard layout shell: sidebar + mobile-only top bar with the menu button + `EmailVerificationBanner` + content area. Wraps every `(dashboard)` page. Takes `defaultOpen` (from the `sidebar_state` cookie, read in the layout). |
| `AppSidebar` | Sidebar nav content rendered inside `AppShell`. |
| `navTitle()` / `authTitle()` | `src/lib/page-metadata.ts`: translated page `<title>` for `generateMetadata` (dashboard pages use `sidebar.nav.*`, auth pages `auth.<page>.title`). Every page exports one; the root layout adds the app name as a suffix. |
| `EmailVerificationBanner` | Dismissible-by-verification banner shown while the signed-in user's email is unverified. |
| `LanguageToggle` | Locale switcher (`en`/`de`); persists the choice in the `ui-locale` cookie (Server Action) and on the user profile (`user.locale`). |
| `LocaleSync` | Mounted in the dashboard layout: applies the saved `user.locale` to the cookie on a new device, or saves the active locale when the user has none yet. |
| `EntityHeader`, `EntityContainer`, `EntitySearch`, `EntityPagination` | Building blocks for list pages (title + "new" button, page layout, search input, prev/next pagination with result count). See [Pagination demo](./demos/pagination.md). |
| `EmptyView`, `ErrorView` | Empty (with call to action) and error (with retry) states for list pages. |
| `MarkdownContent` | Renders Markdown (GitHub-flavored) with design tokens; code blocks get syntax highlighting, a language label and a copy button. Used for AI chat replies. |
| `CopyButton`, `IconActionButton` | Copy-to-clipboard icon button (check mark feedback, error toast) and the small circular icon button it is built on. |
| `PwaRegister` | Registers the service worker (`public/sw.js`) in production. Mounted once in the root layout. |

Details on the four required UI states (loading/empty/error/content) and confirm-dialog wiring: [Frontend](./frontend.md).

## See also

- [Architecture](./architecture.md) - full project structure, key files, request flow.
- [Features](./features.md) - the feature-module pattern and existing demo features (each demo's own hooks/components live under `src/features/demo/*` and aren't listed here).
- [Frontend](./frontend.md) - design system, UI states, i18n.
- [Environment Variables](./environment-variables.md) - what each `env.*` field means.
