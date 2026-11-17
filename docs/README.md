# Documentation

Full documentation for this Next.js SaaS starter template. Start with [Getting Started](./getting-started.md) if you're setting the project up locally for the first time.

| Page | What's in it |
|---|---|
| [Getting Started](./getting-started.md) | Local setup: clone, install, environment variables, Docker services, database migration, first run. |
| [Quick Reference](./quick-reference.md) | At-a-glance lookup table of the utilities, hooks, and helpers already in the codebase - check here before writing a new one. |
| [Environment Variables](./environment-variables.md) | Canonical reference for every env var - what it does, whether it's required, and where it's read. |
| [Architecture](./architecture.md) | Tech stack, request flow, full project structure, key files, tRPC procedure types. |
| [Features](./features.md) | The feature-module pattern, a tour of every existing demo feature, and how to add a new one. |
| [Data Fetching](./data-fetching.md) | Step-by-step: client-side `useQuery`/`useMutation`, server-side `prefetch()` + hydration, and the direct `caller`. |
| [Database](./database.md) | Prisma schema, models, and the migration workflow. |
| [Auth & Billing](./auth-and-billing.md) | Better Auth configuration, OAuth setup, Polar billing, premium feature gating. |
| [Background Jobs](./background-jobs.md) | Inngest concepts, existing jobs, adding new jobs, Realtime subscriptions. |
| [Integrations](./integrations.md) | AI (OpenRouter), Redis, Plausible analytics, Sentry error tracking, and PWA support. |
| [Service Worker](./service-worker.md) | The hand-written PWA service worker: caching strategies, offline behavior, updates and versions, privacy on sign-out, testing and troubleshooting. |
| [Frontend](./frontend.md) | UI components, the design system, required UI states, confirm dialogs, state management, i18n. |
| [Deployment](./deployment.md) | Docker production setup, making Inngest durable, reverse proxy, pre-deploy checklist. |

## Demos

Each demo under `/demo/*` exists to show off one specific technique - not just "an example CRUD app." Full walkthrough per demo:

| Page | What it shows off |
|---|---|
| [AI Chat](./demos/ai.md) | Resumable streaming - a refresh mid-response doesn't lose the reply. |
| [Booking Wizard](./demos/booking.md) | Multi-step client state (Zustand + sessionStorage) decoupled from the server, plus real error/retry handling. |
| [Background Jobs](./demos/inngest.md) | Durable multi-step jobs with live status via Inngest Realtime - no polling. |
| [Pagination](./demos/pagination.md) | Fully server-driven pagination/search/filter/sort with URL state via nuqs and server prefetching, built from reusable entity components. |
| [Posts CRUD](./demos/posts.md) | The canonical reference implementation to copy for a real feature, plus premium-gated procedures. |

## Make It Yours

Once the demos above have shown you what's here, [Make It Yours](./make-it-yours.md) is the separate, one-time checklist for turning the starter into your own product - rebranding, removing demo features, and configuring or removing every optional integration - before you move on to [Deployment](./deployment.md).

For AI coding agent instructions (not user-facing docs, and not part of this site), see `CLAUDE.md`, `AGENTS.md`, and the design token spec in `DESIGN.md` at the repo root.
