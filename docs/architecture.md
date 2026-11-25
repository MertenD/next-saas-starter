# Architecture

## Tech stack

| Category                      | Technology |
|-------------------------------|---|
| **Framework**                 | Next.js 16 (App Router, Turbopack) |
| **Language**                  | TypeScript (strict mode) |
| **API Layer**                 | tRPC v11 + TanStack Query v5 |
| **Database**                  | PostgreSQL + Prisma ORM |
| **Auth**                      | Better Auth (email/password + Google + GitHub OAuth) |
| **Payments**                  | Polar.sh (subscriptions + customer portal) |
| **Background Jobs**           | Inngest |
| **AI**                        | Vercel AI SDK + OpenRouter |
| **Cache**                     | Redis |
| **Analytics**                 | Plausible (self-hosted or cloud, optional) |
| **Error tracking**            | Sentry (optional, off unless a DSN is set) |
| **PWA**                       | Web manifest + hand-written service worker |
| **UI**                        | shadcn/ui + Tailwind CSS v4 |
| **i18n**                      | next-intl (en + de) |
| **State**                     | Zustand (client) + TanStack Query (server) |
| **Input Validation**          | Zod |
| **Forms**                     | React Hook Form + Zod |
| **Linting/Formatting**        | Biome (not ESLint/Prettier) |
| **Package manager / runtime** | Bun |

There are no automated tests and no CI configuration in this repo - it's a starter template, not a production codebase with an established test suite.

## Request flow

1. React components call tRPC via TanStack Query hooks (`useTRPC()` from `@/trpc/client`).
2. The tRPC router at `src/trpc/routers/_app.ts` aggregates all feature routers.
3. Feature routers in `src/features/*/server/router.ts` handle business logic and call Prisma.
4. Background jobs are defined in `src/inngest/functions.ts` and served via `/api/inngest`.
5. Redis is available via `getRedis()` from `@/lib/redis` for caching/rate limiting.
6. Auth endpoints are served by Better Auth at `/api/auth/[...all]`.

There is no `middleware.ts` - route protection happens in every page via server-side `requireAuth()` / `requireUnauth()` calls (the dashboard layout calls `requireAuth()` too, but layouts are not re-rendered on client-side navigation) (see [`auth-and-billing.md`](./auth-and-billing.md)), not Next.js middleware.

## Project structure

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Unauthenticated route group
│   │   ├── layout.tsx                 Centered card layout
│   │   ├── login/page.tsx             "/login"
│   │   └── signup/page.tsx            "/signup"
│   ├── (dashboard)/                  # Authenticated route group
│   │   ├── layout.tsx                 Calls requireAuth(), wraps children in AppShell
│   │   ├── loading.tsx                Skeleton shown while a dashboard page streams in
│   │   ├── error.tsx                  Route error boundary (ErrorView + retry, reports to Sentry)
│   │   ├── dashboard/page.tsx         "/dashboard"
│   │   ├── settings/page.tsx          "/settings" - account, subscription, language
│   │   └── demo/                      "/demo/*" - see features.md
│   │       ├── ai/page.tsx
│   │       ├── booking/page.tsx
│   │       ├── inngest/page.tsx
│   │       ├── pagination/page.tsx
│   │       └── posts/page.tsx
│   ├── actions/set-locale.ts         # Server actions: set/clear the "ui-locale" cookie
│   ├── global-error.tsx              # Last-resort error page (reports to Sentry, own i18n)
│   ├── loading.tsx                   # Spinner shown while the (dashboard) layout resolves the session
│   ├── manifest.ts                   # PWA web app manifest
│   ├── api/
│   │   ├── auth/[...all]/route.ts    # Better Auth catch-all (sign-in/up/out, OAuth, Polar checkout/portal)
│   │   ├── chat/route.ts             # POST - AI SDK streamText via OpenRouter (resumable)
│   │   ├── chat/[id]/stream/route.ts # GET - resumes an in-flight/completed chat stream
│   │   ├── chat/[id]/stop/route.ts   # POST - aborts the running model generation of a chat
│   │   ├── inngest/route.ts          # Inngest's Next.js serve handler - registers all functions
│   │   ├── pwa-icon/route.tsx        # Generated placeholder PWA icons
│   │   └── trpc/[trpc]/route.ts      # tRPC fetch adapter for the whole appRouter
│   └── layout.tsx                    # Root layout: fonts, next-intl, TRPC provider, Plausible, devtools ("/" redirects to /dashboard via next.config.ts)
├── components/
│   ├── ui/                           # shadcn/ui primitives (see frontend.md)
│   ├── app-shell.tsx                 # Dashboard shell wrapping the sidebar nav
│   ├── app-sidebar.tsx               # Sidebar navigation content
│   ├── confirm-dialog.tsx            # Standard delete/confirm dialog
│   ├── critical-confirm-dialog.tsx   # Retype-to-confirm dialog for destructive actions
│   ├── entity-components.tsx         # List page building blocks (header, search, pagination, states, boundary)
│   ├── language-toggle.tsx           # i18n locale switcher
│   ├── locale-sync.tsx               # Syncs user.locale with the ui-locale cookie
│   ├── markdown-content.tsx          # Markdown renderer with design tokens
│   └── pwa-register.tsx              # Registers the service worker (production only)
├── features/                         # Domain features - see features.md
│   ├── admin/                        # Roles, overview numbers, user management (/admin)
│   ├── privacy/                      # Sessions list, data export, account deletion (Settings > Privacy)
│   ├── auth/                         # Login/register/logout, user info card
│   ├── demo/
│   │   ├── ai/                       # Streaming AI chat demo
│   │   ├── booking/                  # Multi-step wizard demo (Zustand)
│   │   ├── inngest/                  # Trigger + live-status job demo
│   │   ├── pagination/               # Paginated/filterable table demo (entity components, prefetch)
│   │   └── posts/                    # Canonical CRUD example (real Prisma model)
│   ├── subscriptions/                # Polar subscription-state hooks
│   └── user/                         # Current-user data (user.me)
├── lib/                              # See "Key files" below
├── trpc/
│   ├── init.ts                       # baseProcedure, protectedProcedure, adminProcedure, premiumProcedure
│   ├── client.tsx                    # TRPCReactProvider (IndexedDB persistence, 7-day cache)
│   ├── server.tsx                    # Server-side caller + HydrateClient
│   ├── query-client.ts               # TanStack Query config
│   └── routers/_app.ts               # Root router - register new feature routers here
├── inngest/
│   ├── client.ts                     # Inngest client instance
│   ├── functions.ts                  # Background job definitions
│   └── realtime.ts                   # Realtime channel definitions
├── hooks/                            # use-mobile, use-entity-search
├── instrumentation.ts                # Next.js hook: loads Sentry server/edge config
├── instrumentation-client.ts         # Sentry browser init
├── i18n/request.ts                   # next-intl config (cookie-based locale, en/de)
├── config/
│   ├── env.ts                        # Zod-validated environment variables
│   └── constants.ts                  # App-wide constants (APP_NAME, PAGINATION, ...)
└── generated/prisma/                 # Generated Prisma client (gitignored, from `prisma:generate`)
```

## Key files

| File | Purpose |
|---|---|
| `src/lib/db.ts` | Prisma singleton (prevents multiple instances in dev under HMR) |
| `src/lib/auth.ts` | Better Auth server config (email/password + OAuth + Polar plugin) |
| `src/lib/auth-client.ts` | Better Auth client-side hooks |
| `src/lib/auth-utils.ts` | `requireAuth()`, `requireAdmin()`, `requireAuthAndPremium()`, `requireUnauth()`, `getSessionOnServer()` |
| `src/lib/redis.ts` | Redis client - `getRedis()` for lazy-connect |
| `src/lib/user-data.ts` | Cleanup of a user's external data: `deletePolarCustomer()`, `deleteUserRedisData()` (account deletion, admin delete) |
| `src/config/legal.ts` | Operator details for the privacy policy and imprint |
| `src/lib/polar.ts` | `isPolarEnabled` flag + `polarClient` - the central "is billing configured" gate |
| `src/lib/ai.ts` | OpenRouter provider client + `AI_MODEL` |
| `src/lib/stream-context.ts` | Resumable-stream context for the AI chat demo |
| `src/lib/analytics.ts` | `PlausibleEvents` type for typed `usePlausible()` custom events |
| `src/config/env.ts` | Zod-validated `env` object - see [`environment-variables.md`](./environment-variables.md) |
| `src/config/constants.ts` | App-wide constants |
| `src/trpc/init.ts` | tRPC procedures + middleware |
| `src/trpc/routers/_app.ts` | Root router - register new routers here |
| `src/inngest/client.ts` | Inngest client instance |
| `src/inngest/functions.ts` | Background job definitions |
| `src/i18n/request.ts` | next-intl config |
| `prisma/schema.prisma` | Database schema |

## tRPC procedure types

| Procedure | Auth required | Premium required |
|---|---|---|
| `baseProcedure` | No | No |
| `protectedProcedure` | Yes (Better Auth session) | No |
| `adminProcedure` | Yes | No (requires the `admin` role, else `FORBIDDEN`) |
| `premiumProcedure` | Yes | Yes (Polar active subscription, or always when Polar is unconfigured) |

Defined in `src/trpc/init.ts`. `protectedProcedure` throws `UNAUTHORIZED` if there's no session. `premiumProcedure` builds on it and additionally throws `FORBIDDEN` unless the user has an active Polar subscription - except when Polar isn't configured at all (`isPolarEnabled` is false), in which case it grants access to everyone, so premium-gated demos still work with zero Polar setup.

## Where to go next

- [`features.md`](./features.md) - the feature-module pattern and a tour of each existing feature.
- [`data-fetching.md`](./data-fetching.md) - client-side `useQuery`/`useMutation` vs. server-side `prefetch()` + hydration vs. the direct `caller`, step by step.
- [`database.md`](./database.md) - Prisma schema and migrations.
- [`auth-and-billing.md`](./auth-and-billing.md) - Better Auth and Polar in depth.
- [`background-jobs.md`](./background-jobs.md) - Inngest.
- [`frontend.md`](./frontend.md) - UI components, state, i18n.
