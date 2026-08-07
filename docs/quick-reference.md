# Quick Reference

A fast lookup table of the utilities, hooks, and helpers already in this codebase - check here before writing a new one. Each entry links to the file that defines it; follow the links in the other docs pages for the full explanation.

## Auth & access guards

Server-side (Server Components, Server Actions) - `src/lib/auth-utils.ts`:

| Export | What it does |
|---|---|
| `requireAuth()` | Redirects to `/login` if there's no session; otherwise returns the session. |
| `requireAuthAndPremium(redirectUrl?)` | Like `requireAuth`, plus redirects if the user has no active Polar subscription. Skipped when Polar isn't configured. |
| `requireUnauth()` | Redirects signed-in users away from auth-only pages (login, signup) back to `/`. |
| `getSessionOnServer()` | Reads the session without redirecting; `null` when unauthenticated. |
| `requirePremiumUserFromRequest(req)` | Route Handler variant of `requireAuthAndPremium` - throws a 401/403 `Response` instead of redirecting. |

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

## Backend clients & services

| Export | Where | What it does |
|---|---|---|
| `prisma` (default export) | `src/lib/db.ts` | Shared Prisma client. Always import this instead of `new PrismaClient()`. |
| `getRedis()` | `src/lib/redis.ts` | Shared Redis client, connects lazily on first call. |
| `redis` (default export) | `src/lib/redis.ts` | Raw client instance - may not be connected yet, prefer `getRedis()`. |
| `isPolarEnabled` / `polarClient` | `src/lib/polar.ts` | Whether billing is configured, and the Polar SDK client (`null` if not). Check the flag before using the client. |
| `isResendEnabled` / `resendClient` | `src/lib/resend.ts` | Whether transactional email is configured, and the Resend client (`null` if not). |
| `sendEmail({ to, subject, html })` | `src/lib/mailer.ts` | Sends via Resend, falls back to console-logging the email when Resend isn't configured. |
| `resetPasswordEmailHtml(...)` / `verifyEmailHtml(...)` | `src/lib/mailer.ts` | Pre-built HTML templates for the two auth emails. |
| `openrouter` / `AI_MODEL` | `src/lib/ai.ts` | Shared Vercel AI SDK provider and default chat model id, for `streamText`/`generateText`. |
| `getStreamContext()` | `src/lib/stream-context.ts` | Shared resumable-stream context for resumable AI chat responses. |

## tRPC (data fetching)

| Export | Where | What it does |
|---|---|---|
| `useTRPC()` | `src/trpc/client.tsx` | Client components: get query/mutation options for `useQuery`/`useMutation`. |
| `TRPCReactProvider` | `src/trpc/client.tsx` | Root client provider (tRPC + React Query + IndexedDB persistence). Mounted once in `layout.tsx`. |
| `trpc` (options proxy) | `src/trpc/server.tsx` | Server Components: build the same query options as `useTRPC()`, for use with `prefetch`. |
| `caller` | `src/trpc/server.tsx` | Direct server-side procedure calls as plain async functions, no HTTP round-trip. |
| `prefetch(queryOptions)` | `src/trpc/server.tsx` | Prefetches a query into the request-scoped `QueryClient` from a Server Component. |
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
| `useIsMobile()` | `src/hooks/use-mobile.ts` | Live viewport check below the 768px breakpoint. `false` during SSR - prefer CSS breakpoints unless you need a real JS conditional. |
| `useUIStore` | `src/stores/ui-store.ts` | Zustand store for cross-cutting UI state (currently: sidebar collapsed/expanded). |

## Shared components

Non-`ui/` components in `src/components/` - see [Frontend](./frontend.md) for the full `ui/` primitive list.

| Component | What it does |
|---|---|
| `ConfirmDialog` | Standard "Are you sure?" dialog for ordinary, low-stakes deletes. Never wire a delete straight to a click. |
| `CriticalConfirmDialog` | Destructive/hard-to-reverse deletes - user must retype a confirmation string before confirming. |
| `AppShell` | Dashboard layout shell: sidebar + `EmailVerificationBanner` + content area. Wraps every `(dashboard)` page. |
| `AppSidebar` | Sidebar nav content rendered inside `AppShell`. |
| `EmailVerificationBanner` | Dismissible-by-verification banner shown while the signed-in user's email is unverified. |
| `LanguageToggle` | Locale switcher (`en`/`de`); persists the choice via a cookie-writing Server Action. |

Details on the four required UI states (loading/empty/error/content) and confirm-dialog wiring: [Frontend](./frontend.md).

## See also

- [Architecture](./architecture.md) - full project structure, key files, request flow.
- [Features](./features.md) - the feature-module pattern and existing demo features (each demo's own hooks/components live under `src/features/demo/*` and aren't listed here).
- [Frontend](./frontend.md) - design system, UI states, i18n.
- [Environment Variables](./environment-variables.md) - what each `env.*` field means.
