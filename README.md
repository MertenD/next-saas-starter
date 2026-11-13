# Next.js SaaS Starter

A production-ready Next.js SaaS template with everything you need to build and ship a modern SaaS application.

## Tech Stack

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
| **Error tracking**            | Sentry (optional) |
| **UI**                        | shadcn/ui + Tailwind CSS v4 |
| **i18n**                      | next-intl (en + de) |
| **State**                     | Zustand (client) + TanStack Query (server) |
| **Input Validation**          | Zod |
| **Forms**                     | React Hook Form + Zod |
| **Linting/Formatting**        | Biome (not ESLint/Prettier) |
| **Package manager / runtime** | Bun |

## Quick Start

```bash
git clone <repo-url> my-app && cd my-app
bun install
cp .env.example .env        # fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.
docker compose up -d        # Postgres, Redis, Inngest dev server
bun run prisma:migrate && bun run prisma:generate
bun run dev                 # http://localhost:3000
```

See [**Getting Started**](./docs/getting-started.md) for the full walkthrough, including OAuth and Polar setup.

## Documentation

Full docs live in [`docs/`](./docs/README.md) - readable as plain Markdown, or as a searchable site via `bun run docs:dev` (see [Getting Started](./docs/getting-started.md#reading-these-docs-as-a-website)):

- [Getting Started](./docs/getting-started.md) - local setup
- [Environment Variables](./docs/environment-variables.md) - every env var explained
- [Architecture](./docs/architecture.md) - stack, request flow, project structure
- [Features](./docs/features.md) - existing demo features, adding a new one
- [Database](./docs/database.md) - Prisma schema and migrations
- [Auth & Billing](./docs/auth-and-billing.md) - Better Auth, OAuth, Polar, premium gating
- [Background Jobs](./docs/background-jobs.md) - Inngest
- [Integrations](./docs/integrations.md) - AI, Redis, analytics
- [Frontend](./docs/frontend.md) - UI components, design system, i18n, state management
- [Deployment](./docs/deployment.md) - Docker production setup, pre-deploy checklist

For AI coding agent instructions, see [`CLAUDE.md`](./CLAUDE.md), [`AGENTS.md`](./AGENTS.md), and [`DESIGN.md`](./DESIGN.md).
