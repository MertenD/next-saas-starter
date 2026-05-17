# Deployment

## Docker (self-hosted)

The template ships with a production multi-stage `Dockerfile` (Bun-based: `deps` → `builder` → `runner`) and a `docker-compose.prod.yml` that includes the app, Postgres, Redis, and Inngest.

**1. Fill in your production `.env`:**

```bash
cp .env.example .env
# Edit .env - set POLAR_SERVER=production, real secrets, your domain as BETTER_AUTH_URL, etc.
```

**2. Start the full stack:**

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

`docker-entrypoint.sh` runs `prisma migrate deploy` automatically before starting the server, so migrations apply on every deploy.

**3. Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

> **Note:** `DATABASE_URL`, `REDIS_URL`, and `INNGEST_BASE_URL` are overridden inside `docker-compose.prod.yml` to Docker-internal hostnames (`postgres`, `redis`, `inngest`). Every other variable is read from your `.env` file. During the image build, `SKIP_ENV_VALIDATION=1` bypasses Zod env validation (there's no real `.env` at build time) - validation runs for real when the container starts.

## Making Inngest durable

Out of the box, `docker-compose.prod.yml` runs the `inngest` service with `inngest dev` - the lightweight dev server. It's in-memory and drops all queued/in-flight jobs on every restart. That's fine to try things out, but for a real deployment you'll want persistent job storage. This stays fully self-hosted throughout - your app talks to your own `inngest` container, never Inngest Cloud.

**Give Inngest its own database** - simplest option is a second database on the existing `postgres` service, via an init script:

```sql
-- docker/inngest-init.sql
CREATE DATABASE inngest_db;
```

```yaml
# docker-compose.prod.yml - postgres service
postgres:
  # ...
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./docker/inngest-init.sql:/docker-entrypoint-initdb.d/inngest-init.sql
```

(This init script only runs on first container start against an empty volume. If Postgres already has data, create the database manually instead: `docker compose -f docker-compose.prod.yml exec postgres psql -U saas -c "CREATE DATABASE inngest_db"`.)

**Switch the `inngest` service to `inngest start`** with persistent storage:

```yaml
# docker-compose.prod.yml
inngest:
  image: inngest/inngest:latest
  command: >
    inngest start --host 0.0.0.0
    --postgres-uri postgres://saas:saas@postgres:5432/inngest_db
    --redis-uri redis://redis:6379/1
  ports:
    - "8288:8288"
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_started
  restart: unless-stopped
```

Redeploy with `docker compose -f docker-compose.prod.yml up --build -d`.

### A note on request signing

`src/inngest/client.ts` hardcodes `isDev: true` on the Inngest SDK client - permanently, not just for local dev:

```typescript
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  middleware: [realtimeMiddleware()],
  isDev: true,
});
```

The in-code comment explains why: since this app is designed to only ever talk to a self-hosted Inngest instance (never Inngest Cloud), forcing dev mode regardless of `NODE_ENV` stops the SDK from assuming Cloud mode and demanding an `INNGEST_EVENT_KEY` at boot. One consequence: **the app's requests to Inngest stay unsigned even in production**, because `isDev: true` disables the SDK's signature-verification path. Switching the `inngest` container to `inngest start` gives you durable job storage (the goal above), but it does **not** get you signed request verification unless you also remove `isDev: true` from `client.ts` and configure `INNGEST_SIGNING_KEY`/`INNGEST_EVENT_KEY` on both the `inngest` and `app` services - a manual change beyond what this template sets up by default. If you need that hardening, the security boundary in the meantime is network-level: don't expose the Inngest container's port to the public internet.

## Reverse proxy (Traefik / nginx)

The app listens on port `3000`. Point your reverse proxy there and terminate TLS. Example Traefik labels as an override file:

```yaml
# docker-compose.traefik.yml
services:
  app:
    labels:
      - traefik.enable=true
      - traefik.http.routers.saas.rule=Host(`yourdomain.com`)
      - traefik.http.routers.saas.entrypoints=websecure
      - traefik.http.routers.saas.tls.certresolver=le
      - traefik.http.services.saas.loadbalancer.server.port=3000
```

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d
```

If you expose the Inngest container's Realtime endpoint through the same proxy, point `NEXT_PUBLIC_INNGEST_BASE_URL` at that public URL - see [`environment-variables.md`](./environment-variables.md).

## Pre-deploy checklist

- [ ] All environment variables set in `.env` - see [`environment-variables.md`](./environment-variables.md)
- [ ] `POLAR_SERVER=production`
- [ ] `BETTER_AUTH_URL` set to your production domain
- [ ] OAuth redirect URIs updated in Google / GitHub developer consoles
- [ ] Polar product ID replaced in `src/lib/auth.ts`
- [ ] `NEXT_PUBLIC_INNGEST_BASE_URL` points at a URL the browser can actually reach (not a Docker-internal hostname)
- [ ] Decided whether the default in-memory `inngest dev` setup is acceptable, or switched to `inngest start` with persistent storage (see above) - the default loses all queued jobs on every restart

## Optional additions

Intentionally omitted to keep the template lean:

- **Sentry** - error tracking: `bun add @sentry/nextjs`
- **PWA** - `bun add @ducanh2912/next-pwa`
- **Framer Motion** - animations: `bun add framer-motion`
