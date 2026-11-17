<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

@DESIGN.md

# AGENTS.md

This file provides guidance to AI coding agents (Claude Code and others) working in this repository. It covers the rules and conventions to follow while writing code. For full human-facing documentation, see [`docs/`](./docs/README.md).

## Documentation

Full docs live in [`docs/`](./docs/README.md) - also servable as a searchable site via `bun run docs:dev`:

- [Getting Started](./docs/getting-started.md) - local setup
- [Quick Reference](./docs/quick-reference.md) - existing utilities/hooks/helpers, check before writing a new one
- [Environment Variables](./docs/environment-variables.md) - every env var explained
- [Architecture](./docs/architecture.md) - stack, request flow, project structure, key files, tRPC procedure types
- [Features](./docs/features.md) - the feature-module pattern, existing demo features, adding a new one
- [Data Fetching](./docs/data-fetching.md) - client `useQuery`/`useMutation`, server `prefetch()` + hydration, direct `caller`
- [Database](./docs/database.md) - Prisma schema and migrations
- [Auth & Billing](./docs/auth-and-billing.md) - Better Auth, OAuth, Polar, premium gating
- [Background Jobs](./docs/background-jobs.md) - Inngest
- [Integrations](./docs/integrations.md) - AI, Redis, analytics, Sentry, PWA
- [Frontend](./docs/frontend.md) - UI components, design system, i18n, state management
- [Make It Yours](./docs/make-it-yours.md) - checklist for turning this template into a real product, separate from Getting Started
- [Deployment](./docs/deployment.md) - Docker production setup, pre-deploy checklist

Check the relevant page before implementing anything non-trivial - `docs/` is the source of truth, not this file.

## Design System

`DESIGN.md` defines the design system for this app (colors, typography, spacing, radii, elevation, and component specs) and **must be followed for every UI change** - new components, page layouts, and styling edits alike. Use its tokens (e.g. `{colors.primary}`, `{typography.body-md}`, `{rounded.md}`, `{spacing.lg}`) rather than inventing ad hoc colors, font sizes, or spacing values. If a needed pattern isn't covered by `DESIGN.md`, extend it consistently with the existing tokens/components instead of introducing a one-off style, and flag the gap to the user.

## UI States (Loading / Empty / Error / Content)

Every fetch (tRPC query, mutation, server-side data load - anything async) and every component that displays fetched or user-generated content **must implement all four states**. Never ship only the happy path.

1. **Content** - the normal populated state. The default case once data has loaded successfully and isn't empty.
2. **Loading** - shown while the request is in flight. Pick the treatment based on what's loading and how long it typically takes:
    - **Skeleton** (`@/components/ui/skeleton`) - default for structured content (lists, cards, tables) that has a known final layout; shape the skeleton to match it.
    - **Spinner** (`@/components/ui/spinner`) - short or unstructured loads: buttons mid-submit, small inline widgets, anything without a stable layout to skeleton.
    - **Progress bar** - long-running, determinate operations (uploads, multi-step background jobs) where percentage/step feedback is meaningful. Not installed yet - add with `bunx shadcn@latest add progress` before using.
3. **Empty** - the request succeeded but returned no data. Use `@/components/ui/empty` (`Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`) and always include a call to action (e.g. "Create your first project" button) - never render blank space or a bare "No data" string.
4. **Error** - the request failed (tRPC error, network error, etc.). Explain what went wrong in plain language and give the user something actionable to do - a "Try again" button wired to the query's `refetch()`/mutation retry when retrying is sensible, otherwise a concrete next step (e.g. "Contact support", "Go back").

With TanStack Query hooks (`useQuery`/`useSuspenseQuery` via `useTRPC()`), map states as: `isPending`/`isLoading` → Loading, `isError` → Error (use `refetch` for the retry action), `data` with empty array/null → Empty, otherwise → Content. All state variants must also follow `DESIGN.md`'s tokens (see Design System above) - no unstyled fallback states.

## Delete Confirmation

**Deleting anything must never happen directly off a click** - always confirm through a dialog first. Two reusable components exist for this; never build a one-off confirmation dialog inline:

- **`ConfirmDialog`** (`@/components/confirm-dialog`) - the standard "Are you sure?" dialog with Confirm/Cancel. Use for ordinary, low-stakes deletes (a post, a list item, anything easily recreated or recoverable).
- **`CriticalConfirmDialog`** (`@/components/critical-confirm-dialog`) - for destructive, hard-to-reverse actions (deleting an account, an organization, a production resource). The user must retype a confirmation string (e.g. the item's name) exactly before the confirm button enables - it's disabled otherwise.

Wire the mutation's `isPending` into the dialog's `isLoading` prop, and close the dialog from the mutation's `onSuccess` (the dialog does not auto-close on confirm). Pick `ConfirmDialog` by default; reach for `CriticalConfirmDialog` only when the action is genuinely hard to undo or affects more than the current record.

## Commands

```bash
bun run dev           # Start Next.js dev server (Turbopack)
bun run dev:all       # Start Next.js + Inngest in parallel (via mprocs) - alternative to the Docker Inngest service
bun run build         # Production build
bun run lint          # Run Biome linter
bun run format        # Format code with Biome

bun run prisma:migrate        # Run DB migrations (dev)
bun run prisma:migrate-deploy # Deploy migrations (prod)
bun run prisma:generate       # Regenerate Prisma client after schema changes
bun run prisma:studio         # Open Prisma Studio UI
bun run db:seed               # Seed demo posts for existing users (prisma/seed.ts, optional SEED_USER_EMAIL)

bun run inngest:dev   # Start Inngest dev server locally (port 8288) - normally started via `docker compose up -d` instead (see docker-compose.yml)

bun run docs:dev      # Serve docs/ as a local VitePress site
bun run docs:build    # Build the docs site to docs/.vitepress/dist
```

Docs auto-deploy to GitHub Pages via `.github/workflows/docs.yml` on every push to `main` that touches `docs/**` (see `docs/.vitepress/config.mts` for the `base` path, which must match the repo name).

There are no automated tests in this project.

## Architecture

Full-stack Next.js app (App Router) with tRPC, PostgreSQL/Prisma, Better Auth, Polar (payments), Inngest (background jobs), Redis, Vercel AI SDK, next-intl (i18n), Plausible (analytics, optional), and Sentry (error tracking, optional, off without `NEXT_PUBLIC_SENTRY_DSN`). Full stack table, request flow, project structure, key files, and tRPC procedure types: [`docs/architecture.md`](./docs/architecture.md).

**Linting/formatting:** Biome (NOT ESLint/Prettier). Never reference or create ESLint config files.
**Path alias:** `@/*` maps to `./src/*`.

## Adding a New Feature

Every domain feature lives under `src/features/<feature>/` with a `schema/`, `server/`, `hooks/`, `components/`, `model/` subset. Full walkthrough with code snippets and a tour of existing features: [`docs/features.md`](./docs/features.md).

## Environment Variables

Copy `.env.example` to `.env`. Full reference for every variable (required vs. optional, defaults, where it's read): [`docs/environment-variables.md`](./docs/environment-variables.md).

## i18n

Supported locales: `en`, `de`. The locale lives in the `ui-locale` cookie and in `user.locale` (kept in sync by `LanguageToggle` and `LocaleSync`). Server: `getTranslations()` from `next-intl/server`. Client: `useTranslations()` from `next-intl`. Details: [`docs/frontend.md`](./docs/frontend.md#internationalization-next-intl).

## Database Migrations

`bun run prisma:migrate` (dev), `bun run prisma:generate`, `bun run prisma:migrate-deploy` (prod, runs automatically in the Docker entrypoint). Schema and models: [`docs/database.md`](./docs/database.md).

## Reusable UI pieces to check first

- **List pages** (header, search, pagination, loading/empty/error): use `src/components/entity-components.tsx` (`EntityHeader`, `EntityContainer`, `EntitySearch`, `EntityPagination`, `EmptyView`, `ErrorView`) and `useEntitySearch` instead of building new ones. Reference: `src/features/demo/pagination` ([docs](./docs/demos/pagination.md)), which also shows the server-prefetch pattern (`params-loader` -> `prefetch` -> `HydrateClient` -> client `useQuery` with the same `queryOptions()`).
- **LLM / Markdown text:** `MarkdownContent` (`src/components/markdown-content.tsx`). It lazy-loads `markdown-renderer.tsx`; never import the renderer directly.
- **Route loading/error:** `src/app/loading.tsx` (spinner, covers the session-blocking dashboard layout), `src/app/(dashboard)/loading.tsx` (skeleton) and `src/app/(dashboard)/error.tsx` (`ErrorView` + `retry`). This Next.js version passes `retry` (not `reset`) to `error.tsx`.
- **OAuth buttons:** `OAuthButtons` (`src/features/auth/oauth-buttons.tsx`); only render providers returned by `getEnabledOAuthProviders()` (`src/lib/oauth-providers.ts`). A new provider must be added in both places and in `src/lib/auth.ts`.
- **Service worker / PWA:** `public/sw.js` is hand-written (no `next-pwa`, it does not support Turbopack). Bump its `VERSION` when changing caching rules. Call `clearPwaPageCache()` (`src/lib/pwa.ts`) wherever a session is ended.
- **Sign-out:** always use `useSignOut()` (`src/features/auth/hooks/use-sign-out.ts`), never `authClient.signOut` directly. It also clears the React Query cache and its IndexedDB copy (`clearPersistedQueryCache()` in `src/trpc/client.tsx`). Query keys holding user-specific data that are not tRPC keys must include the user id (see `use-subscription.ts`). Bump `PERSIST_BUSTER` in `src/trpc/client.tsx` when query keys or cached data shapes change.
- **API route handlers** under `src/app/api/` (other than `auth`, `inngest`, `trpc`, `pwa-icon`) must authenticate with `getSessionOnServer()` and return `401` without a session; validate bodies with `safeParse` and return `400`, never let `parse` throw. Never persist or echo payment data (see the booking store's `partialize`).
- **Dashboard data:** client components under `(dashboard)` read the current user and the billing flag from `useDashboard()` (`src/components/dashboard-context.tsx`, filled by the layout on the server), never from `authClient.useSession()` or an extra tRPC query. After mutating the user, call `router.refresh()`. Pages that `prefetch()` must wrap their client subtree in their own `HydrateClient` and `await` the prefetch when the client reads it with `useQuery` (a not-awaited prefetch renders the loading state on the server while the client hydrates with data: hydration mismatch). Only `useSuspenseQuery` inside `<Suspense>` may skip the `await`. Default: `await prefetch()` + `useQuery` for fast queries; no-`await` + `useSuspenseQuery` + `<Suspense>` only for slow queries next to content that should not wait (decision guide with examples: `docs/data-fetching.md`, section "Which variant do I use?").
- **Server session and billing checks:** use `getSessionOnServer()` and `getPolarCustomerState()` (both request-cached, `src/lib/auth-utils.ts`) instead of calling `auth.api.getSession` or the Polar client directly. Scope ownership in the Prisma `where` (`{ id, userId }`) instead of read-then-check. Sidebar and nav `<Link>`s keep the default prefetch (no `prefetch` prop).
- **Memoization and component identity:** never declare a component inside another component (it remounts on every render; see `NavLink` in `app-sidebar.tsx`). The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`), so do not write `useMemo`/`useCallback` for render performance: it memoizes values (e.g. a Zod schema built from translated messages inside a form component) and callbacks automatically. Constant objects that never depend on props or state (e.g. react-markdown `components`) still live at module level. Use `"use no memo"` in a component only to opt out when the compiler breaks something. Subscribe to form fields with `useWatch`, not `form.watch()`, and to Zustand state through narrow selectors (see `use-booking-wizard.ts`). Per-item components rendered in streaming lists use `memo`.
- **Static, translation-only components** (no state, no handlers) are Server Components using `getTranslations()`, not `"use client"` (see `how-it-works-card.tsx`). Sidebar open/closed state is the `sidebar_state` cookie (read in the dashboard layout, owned by `SidebarProvider`); there is no global UI store.
- **Layout landmarks:** `SidebarInset` already renders the page's `<main>`; pages and shared page containers must use `<div>`/`<section>`, never a second `<main>`.
- **Sentry:** config files are `sentry.*.config.ts`, `src/instrumentation*.ts`, `src/app/global-error.tsx`. `withSentryConfig` is imported from `@sentry/nextjs/config` (v11). Never call `Sentry.init` without a DSN guard (a disabled init still patches `fetch`). Client-side `NEXT_PUBLIC_*` values must also be passed as Docker build args (see `Dockerfile`).
- **`global-error.tsx`** renders without the i18n provider: its texts come from the `globalError` namespace in `messages/*.json`, imported directly.

## Additional Rules

- Try not to use any.
- When implementing something new, look in the existing codebase and check if there's already a component, hook, or utility that does what you need. Reuse instead of reinventing.
- Keep it simple - avoid overengineering. If a feature can be implemented with a simple component and a few hooks, don't introduce unnecessary abstractions or patterns.
- Use TypeScript types and Zod schemas for validation. Avoid using `any` or untyped data structures.
- Never use em dashes (—) anywhere, in code, comments, docs, or prose - always use a regular hyphen (-) instead.
- Don't use semicolons in TypeScript/JavaScript code, including import lines. I prefer a semicolon-free style. Only use semicolons where required by the language (e.g., for `for` loops). Enforced via Biome's `javascript.formatter.semicolons: "asNeeded"` in `biome.json` - run `bun run format` to apply it (it strips semicolons your editor's auto-import may add).

## Code Comments

Central, reusable code - `src/lib/*`, `src/trpc/*`, `src/config/*`, `src/inngest/*`, shared hooks/stores (`src/hooks`, `src/stores`), shared non-`ui/` components, and reusable feature-level utils (URL-state param builders, wizard stores, auth/subscription hooks, etc.) - should carry a `/** ... */` doc comment above each exported function/value explaining its purpose, non-obvious behavior, and where it's consumed. Do not add this for shadcn components under `components/ui/`, and don't add per-line or per-demo comments for one-off demo business logic (e.g. the mock CRUD routers under `src/features/demo/*/server`) unless a specific line is genuinely non-obvious. Always in English, no em dashes.