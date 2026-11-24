# Next.js SaaS Starter

A production-ready Next.js SaaS template with everything you need to build and ship a modern SaaS application.

## Tech Stack

| Category                      | Technology |
|-------------------------------|---|
| **Framework**                 | <img src="docs/public/icons/nextdotjs.svg" alt="" width="18" height="18" align="top">&nbsp;Next.js 16 (App Router, Turbopack) |
| **Language**                  | <img src="docs/public/icons/typescript.svg" alt="" width="18" height="18" align="top">&nbsp;TypeScript (strict mode) |
| **API Layer**                 | <img src="docs/public/icons/trpc.svg" alt="" width="18" height="18" align="top">&nbsp;tRPC v11 + <img src="docs/public/icons/tanstack.svg" alt="" width="18" height="18" align="top">&nbsp;TanStack Query v5 |
| **Database**                  | <img src="docs/public/icons/postgresql.svg" alt="" width="18" height="18" align="top">&nbsp;PostgreSQL + <img src="docs/public/icons/prisma.svg" alt="" width="18" height="18" align="top">&nbsp;Prisma ORM |
| **Auth**                      | <img src="docs/public/icons/betterauth.svg" alt="" width="18" height="18" align="top">&nbsp;Better Auth (email/password + <img src="docs/public/icons/google.svg" alt="" width="18" height="18" align="top">&nbsp;Google + <img src="docs/public/icons/github.svg" alt="" width="18" height="18" align="top">&nbsp;GitHub OAuth) |
| **Payments**                  | <img src="docs/public/icons/credit-card.svg" alt="" width="18" height="18" align="top">&nbsp;Polar.sh (subscriptions + customer portal) |
| **Background Jobs**           | <img src="docs/public/icons/workflow.svg" alt="" width="18" height="18" align="top">&nbsp;Inngest |
| **AI**                        | <img src="docs/public/icons/vercel.svg" alt="" width="18" height="18" align="top">&nbsp;Vercel AI SDK + <img src="docs/public/icons/openrouter.svg" alt="" width="18" height="18" align="top">&nbsp;OpenRouter |
| **Cache**                     | <img src="docs/public/icons/redis.svg" alt="" width="18" height="18" align="top">&nbsp;Redis |
| **Analytics**                 | <img src="docs/public/icons/plausibleanalytics.svg" alt="" width="18" height="18" align="top">&nbsp;Plausible (self-hosted or cloud, optional) |
| **Error tracking**            | <img src="docs/public/icons/sentry.svg" alt="" width="18" height="18" align="top">&nbsp;Sentry (optional) |
| **UI**                        | <img src="docs/public/icons/shadcnui.svg" alt="" width="18" height="18" align="top">&nbsp;shadcn/ui + <img src="docs/public/icons/tailwindcss.svg" alt="" width="18" height="18" align="top">&nbsp;Tailwind CSS v4 |
| **i18n**                      | <img src="docs/public/icons/languages.svg" alt="" width="18" height="18" align="top">&nbsp;next-intl (en + de) |
| **State**                     | <img src="docs/public/icons/layers.svg" alt="" width="18" height="18" align="top">&nbsp;Zustand (client) + <img src="docs/public/icons/tanstack.svg" alt="" width="18" height="18" align="top">&nbsp;TanStack Query (server) |
| **Input Validation**          | <img src="docs/public/icons/zod.svg" alt="" width="18" height="18" align="top">&nbsp;Zod |
| **Forms**                     | <img src="docs/public/icons/reacthookform.svg" alt="" width="18" height="18" align="top">&nbsp;React Hook Form + <img src="docs/public/icons/zod.svg" alt="" width="18" height="18" align="top">&nbsp;Zod |
| **Linting/Formatting**        | <img src="docs/public/icons/biome.svg" alt="" width="18" height="18" align="top">&nbsp;Biome (not ESLint/Prettier) |
| **Package manager / runtime** | <img src="docs/public/icons/bun.svg" alt="" width="18" height="18" align="top">&nbsp;Bun |

## Screenshots

<table>
  <tr>
    <td width="50%" valign="top">
      <b>Sign in</b><br>
      Email and password plus Google and GitHub, powered by Better Auth.<br>
      <img src="docs/public/screenshots/login.png" alt="Sign-in form with GitHub and Google buttons">
    </td>
    <td width="50%" valign="top">
      <b>Dashboard</b><br>
      Collapsible sidebar and getting-started cards, rendered on the server.<br>
      <img src="docs/public/screenshots/dashboard.png" alt="Dashboard with sidebar navigation and getting-started cards">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Posts (CRUD)</b><br>
      Create, edit and delete with Prisma, tRPC and automatic cache updates.<br>
      <img src="docs/public/screenshots/posts.png" alt="Posts demo: a CRUD list backed by Prisma and tRPC">
    </td>
    <td width="50%" valign="top">
      <b>AI chat</b><br>
      Streaming answers with Markdown, stop, retry and edit; refreshing mid-stream resumes the reply.<br>
      <img src="docs/public/screenshots/ai-chat.png" alt="AI chat demo with a streamed Markdown answer">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Background jobs</b><br>
      Durable multi-step Inngest jobs with live run status streamed to the page, no polling.<br>
      <img src="docs/public/screenshots/background-jobs.png" alt="Background jobs demo with a completed and a running Inngest run">
    </td>
    <td width="50%" valign="top">
      <b>Pagination</b><br>
      Searchable, sortable and filterable table with its state kept in the URL.<br>
      <img src="docs/public/screenshots/pagination.png" alt="Paginated, sortable table of users">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Admin overview</b><br>
      Owner and admin roles with user counts and live revenue, MRR and subscriptions from Polar (shown here without Polar configured).<br>
      <img src="docs/public/screenshots/admin-overview.png" alt="Admin overview with user counts and a billing placeholder">
    </td>
    <td width="50%" valign="top">
      <b>User management</b><br>
      Search users, appoint admins, ban or delete accounts; owners come from an environment variable.<br>
      <img src="docs/public/screenshots/admin-users.png" alt="Admin user table with roles, status and actions">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Profile and security</b><br>
      Edit your profile, verify your email and change your password.<br>
      <img src="docs/public/screenshots/settings.png" alt="Account settings with profile and password forms">
    </td>
  </tr>
</table>

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
- [Admin Area](./docs/admin.md) - owners, admins, overview numbers, user management
- [Background Jobs](./docs/background-jobs.md) - Inngest
- [Integrations](./docs/integrations.md) - AI, Redis, analytics
- [Frontend](./docs/frontend.md) - UI components, design system, i18n, state management
- [Deployment](./docs/deployment.md) - Docker production setup, pre-deploy checklist

For AI coding agent instructions, see [`CLAUDE.md`](./CLAUDE.md), [`AGENTS.md`](./AGENTS.md), and [`DESIGN.md`](./DESIGN.md).
