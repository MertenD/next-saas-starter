# Getting Started

This walks through setting up the app on your machine. For production setup, see [`deployment.md`](./deployment.md).

## 1. Clone and install

```bash
git clone <repo-url> my-app
cd my-app
bun install
```

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`. See [`environment-variables.md`](./environment-variables.md) for what every variable does - the short version for local dev:

- `DATABASE_URL` and `REDIS_URL` already match the services started in the next step, no changes needed.
- `BETTER_AUTH_SECRET` - generate one: `openssl rand -base64 32`.
- `BETTER_AUTH_URL` - leave as `http://localhost:3000`.
- `INNGEST_APP_ID` - any string.
- `NEXT_PUBLIC_INNGEST_BASE_URL` - leave as `http://localhost:8288`.
- Everything else (OAuth, `OPENROUTER_API_KEY`, Polar) is optional - leave unset to skip that integration for now.

## 3. Start external services

PostgreSQL, Redis, and the Inngest dev server are configured in `docker-compose.yml`:

```bash
docker compose up -d
```

This starts:
- **Postgres** on `:5432`
- **Redis** on `:6379`
- **Inngest dev server** on `:8288` - polls your locally-running Next.js app (`bun run dev`) at `/api/inngest` to discover background job functions. Dashboard: [http://localhost:8288](http://localhost:8288).

To stop the services:

```bash
docker compose down        # stop containers, keep data
docker compose down -v     # stop containers and delete data
```

> **Prefer running Inngest without Docker?** Use `bun run dev:all` instead of `bun run dev` in step 6 - it runs the Next.js dev server and `inngest-cli dev` together via `mprocs`. Just make sure the Docker `inngest` container isn't also running, since both bind port `8288`.

## 4. Set up the database

```bash
bun run prisma:migrate    # creates DB tables
bun run prisma:generate   # generates the TypeScript client
```

Optional: after signing up in the app, run `bun run db:seed` to fill the posts demo with example data (see [`database.md`](./database.md#seeding)).

See [`database.md`](./database.md) for the schema and migration workflow in more detail.

## 5. Configure Polar.sh (optional)

Skip this to run without payments - see [`auth-and-billing.md`](./auth-and-billing.md) for what changes when Polar is left unconfigured. To enable it:

1. Create an account at [polar.sh](https://polar.sh)
2. Create a product (e.g. "Pro Plan")
3. Copy your **Product ID** into `POLAR_PRODUCT_ID` in `.env`
4. Set `POLAR_ACCESS_TOKEN`, `POLAR_SUCCESS_URL`, and `POLAR_SERVER=sandbox` in `.env`

## 6. Configure OAuth providers (optional)

See [`auth-and-billing.md`](./auth-and-billing.md#oauth-providers) for the Google Cloud Console / GitHub Developer Settings steps.

## 6b. Create the first admin (optional)

To use the admin area (`/admin`), put your email into `ADMIN_EMAILS` in `.env`, register with it and verify the address (without Resend the verification link is printed to the server log). You become admin at your next sign-in. Details: [`admin.md`](./admin.md).

## 7. Start development

```bash
bun run dev   # Next.js on :3000 - Inngest dev server is already running via Docker (step 3)
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to `/dashboard`. Sign up to create your first account.

Try the background job demo at `/demo/inngest` - click "Trigger Job" and watch it execute step-by-step on the [Inngest dashboard](http://localhost:8288). The other demos live under `/demo/*` in the sidebar (AI chat, booking wizard, customers table, posts CRUD) - see [`features.md`](./features.md) for what each one demonstrates.

## Reading these docs as a website

This `docs/` folder is also a [VitePress](https://vitepress.dev) site (nav, sidebar, search) - you don't need it just to read the Markdown files on GitHub, but it's nicer for browsing:

```bash
bun run docs:dev       # local dev server with hot reload
bun run docs:build     # static build to docs/.vitepress/dist
bun run docs:preview   # serve the production build locally
```

> **Windows + Bun troubleshooting:** if `docs:dev`/`docs:build` fails with something like `Cannot find module @rollup/rollup-win32-x64-msvc` or `@esbuild/win32-x64 could not be found`, Bun has installed the wrong CPU-architecture binary for one of Vite's native dependencies (a known Bun issue on some Windows setups - the same class of bug this template already works around for `@parcel/watcher` in `package.json`). Fix it with:
> ```bash
> bun install --minimum-release-age=0
> ```
> If that still doesn't pull the right binary, delete `node_modules/@rollup` and `node_modules/@esbuild`, then reinstall the same way.

## Next steps

- [`architecture.md`](./architecture.md) - stack overview, request flow, where everything lives.
- [`features.md`](./features.md) - tour of the existing demo features and how to add your own.
- [`deployment.md`](./deployment.md) - making this production-ready.
