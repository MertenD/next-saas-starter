# Environment Variables

This page is the single source of truth for every environment variable the app reads. Start from `.env.example`:

```bash
cp .env.example .env
```

Most variables are validated at startup by a Zod schema in `src/config/env.ts` - if something required is missing or malformed, the app fails fast at boot with a readable error instead of failing later at the call site. A few variables (marked below) are read directly from `process.env` where they're used and aren't part of that schema.

`SKIP_ENV_VALIDATION=1` bypasses the Zod validation entirely. It's set automatically during the Docker build stage (see [`deployment.md`](./deployment.md)) so a missing production `.env` file doesn't fail the build - real validation still runs when the container actually starts.

## Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string. The value in `.env.example` matches `docker-compose.yml`'s Postgres service out of the box. |

## Better Auth

| Variable | Required | Default | Description |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | Yes | - | Session/cookie encryption key. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Yes | - | The app's own base URL (e.g. `http://localhost:3000`, or your production domain). Used to build OAuth callback URLs and auth cookies. |

## OAuth Providers (optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | - | From Google Cloud Console. Leave both unset to disable Google sign-in. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | - | From GitHub Developer Settings. Leave both unset to disable GitHub sign-in. |

Both providers are wired conditionally in `src/lib/auth.ts` - a provider block is only added to Better Auth's `socialProviders` config if its id/secret pair is present. See [`auth-and-billing.md`](./auth-and-billing.md) for setup steps.

## Inngest (background jobs)

| Variable | Required | Default | Description |
|---|---|---|---|
| `INNGEST_APP_ID` | Yes | - | Any unique identifier for your app, used by the Inngest client (`src/inngest/client.ts`). |
| `NEXT_PUBLIC_INNGEST_BASE_URL` | Yes | - | **Browser-facing.** The URL the Inngest Realtime WebSocket connects to from the client (used by `/demo/inngest`'s live status updates). Must be reachable from the user's browser - in a Docker deployment this can **not** be the Docker-internal `http://inngest:8288` hostname; expose the Inngest server through your reverse proxy and point this at that public URL instead. |
| `INNGEST_BASE_URL` | Production only | - | **Server-side.** Not in `.env.example` - set directly in `docker-compose.prod.yml`, overridden to the Docker-internal `http://inngest:8288` hostname so the Next.js server can reach the Inngest container. Only relevant for Docker deployments. |
| `INNGEST_EVENT_KEY` | Production only | - | Shared secret that signs the events the app sends to the self-hosted Inngest server. Even-length hex string, generate with `openssl rand -hex 32`. Also passed to the `inngest` container (`docker-compose.prod.yml` reads it from `.env`). Startup fails in production without it; unused in development. |
| `INNGEST_SIGNING_KEY` | Production only | - | Shared secret that lets `/api/inngest` verify that function calls come from your Inngest server. Same format and rules as `INNGEST_EVENT_KEY`; use a different value. |

## AI (optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | No | - | From [openrouter.ai](https://openrouter.ai). Required only for the `/demo/ai` chat demo and any code using `src/lib/ai.ts`. The demo page shows a warning card instead of crashing when this is unset. |
| `AI_MODEL` | No | `google/gemini-2.5-flash` | Any OpenRouter model id. Read by `src/lib/ai.ts`. |

## Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string. The default matches `docker-compose.yml`'s Redis service. |

## Polar (payments, optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `POLAR_ACCESS_TOKEN` | No | - | From your Polar dashboard. |
| `POLAR_PRODUCT_ID` | No | - | ID of the product users check out (the "pro" plan), from the product page in your Polar dashboard. |
| `POLAR_SUCCESS_URL` | No | - | Redirect URL after a successful checkout (e.g. `http://localhost:3000/dashboard`). |
| `POLAR_SERVER` | No | - | `sandbox` for testing, `production` for live. |

All four must be set together - `src/lib/polar.ts` derives `isPolarEnabled = !!(POLAR_ACCESS_TOKEN && POLAR_SERVER && POLAR_SUCCESS_URL && POLAR_PRODUCT_ID)`. Leave all four unset to disable billing entirely: the Polar plugin is never registered with Better Auth, and `premiumProcedure` / `useHasActiveSubscription()` both grant everyone premium access as a local dev/mock mode. See [`auth-and-billing.md`](./auth-and-billing.md).

## Resend (email, optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `RESEND_API_KEY` | No | - | From your [Resend](https://resend.com) dashboard. |
| `EMAIL_FROM` | No | - | The `from` address/name used for outgoing emails (e.g. `Acme <noreply@example.com>`). Must be a verified domain in Resend for production sending. |

Both must be set together - `src/lib/resend.ts` derives `isResendEnabled = !!(RESEND_API_KEY && EMAIL_FROM)`. Leave both unset to disable real sending: `src/lib/mailer.ts`'s `sendEmail()` logs the email (recipient, subject, and body/link) to the console instead, so password-reset and email-verification links can still be copied out of the terminal during local development. See [`auth-and-billing.md`](./auth-and-billing.md).

## Analytics (optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | No | - | Read directly via `process.env.NEXT_PUBLIC_PLAUSIBLE_SRC` in `src/app/layout.tsx` (not part of the Zod schema, since it's optional and public). Your Plausible site script URL (self-hosted or `plausible.io`). Leave unset to disable analytics - no script is rendered and `<PlausibleProvider>` becomes a no-op. See [`integrations.md`](./integrations.md). |

## Error tracking (optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | No | - | Read directly from `process.env` in `next.config.ts`, `sentry.*.config.ts` and `src/instrumentation-client.ts` (not part of the Zod schema, since it is optional and public). Leave unset to disable Sentry entirely. Inlined at build time - Docker needs it as a build arg. |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | No | `1` in development, `0.1` in production | Share of requests Sentry traces, a number from `0` to `1` (`0` disables tracing). Read through `getTracesSampleRate()` in `src/config/sentry.ts` by the browser, Node and Edge Sentry inits. Invalid values are ignored with a warning. Like the DSN it is inlined into the browser bundle at build time, so with Docker it is a build arg. |
| `SENTRY_ORG` | No | - | Build-time only: your Sentry organization slug, for source map upload. |
| `SENTRY_PROJECT` | No | - | Build-time only: your Sentry project slug, for source map upload. |
| `SENTRY_RECORD_AI_DATA` | No | - | Set to `1` to record AI prompts and model outputs in Sentry traces (read in `sentry.server.config.ts`). Off by default because they can contain personal data. |
| `SENTRY_AUTH_TOKEN` | No | - | Build-time only: auth token for source map upload. Without it the app is still tracked, but stack traces stay minified. Never commit it. |

See [`integrations.md`](./integrations.md#error-tracking-sentry).

## Seed script (optional)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SEED_USER_EMAIL` | No | - | Read by `prisma/seed.ts` (`bun run db:seed`). Seeds demo posts for the user with this email. Unset = every existing user without posts. See [`database.md`](./database.md#seeding). |

## Notes

- `NEXT_PUBLIC_*` variables are inlined into the client bundle at build time (standard Next.js behavior) - never put secrets in one.
- After changing any `NEXT_PUBLIC_*` variable, restart the dev server (and rebuild for Docker) - they're baked in at build time, not read at runtime in the browser.
- See [`getting-started.md`](./getting-started.md) for the full local setup flow, and [`deployment.md`](./deployment.md) for production-specific overrides.
