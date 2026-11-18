# Next.js SaaS Starter

A production-ready Next.js SaaS template with everything you need to build and ship a modern SaaS application.

## Screenshots

<table>
  <tr>
    <td width="50%" valign="top">
      <b>Dashboard</b><br>
      Collapsible sidebar and getting-started cards, rendered on the server.<br>
      <img src="docs/public/screenshots/dashboard.png" alt="Dashboard with sidebar navigation and getting-started cards">
    </td>
    <td width="50%" valign="top">
      <b>Posts (CRUD)</b><br>
      Create, edit and delete with Prisma, tRPC and automatic cache updates.<br>
      <img src="docs/public/screenshots/posts.png" alt="Posts demo: a CRUD list backed by Prisma and tRPC">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>AI chat</b><br>
      Streaming answers with Markdown, stop, retry and edit; refreshing mid-stream resumes the reply.<br>
      <img src="docs/public/screenshots/ai-chat.png" alt="AI chat demo with a streamed Markdown answer">
    </td>
    <td width="50%" valign="top">
      <b>Background jobs</b><br>
      Durable multi-step Inngest jobs with live run status streamed to the page, no polling.<br>
      <img src="docs/public/screenshots/background-jobs.png" alt="Background jobs demo with a completed and a running Inngest run">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Pagination</b><br>
      Searchable, sortable and filterable table with its state kept in the URL.<br>
      <img src="docs/public/screenshots/pagination.png" alt="Paginated, sortable table of users">
    </td>
    <td width="50%" valign="top">
      <b>Sign in</b><br>
      Email and password plus Google and GitHub, powered by Better Auth.<br>
      <img src="docs/public/screenshots/login.png" alt="Sign-in form">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Profile and security</b><br>
      Edit your profile, verify your email and change your password.<br>
      <img src="docs/public/screenshots/settings.png" alt="Account settings with profile and password forms">
    </td>
    <td width="50%" valign="top">
      <b>Mobile</b><br>
      The sidebar becomes a menu sheet behind a top bar button on phones.<br>
      <img src="docs/public/screenshots/mobile.png" alt="Dashboard on a phone with the menu button in the top bar" width="220">
    </td>
  </tr>
</table>

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
