# Deployment

## Docker (self-hosted)

The template ships with a production multi-stage `Dockerfile` (Bun-based: `deps` → `builder` → `runner`) and a `docker-compose.prod.yml` that includes the app, Postgres, Redis, and Inngest.

**1. Fill in your production `.env`:**

```bash
cp .env.example .env
# Edit .env - set POLAR_SERVER=production, real secrets, your domain as BETTER_AUTH_URL, etc.
```

**Optional - Sentry:** `NEXT_PUBLIC_SENTRY_DSN` is baked into the browser bundle during `next build`, so it can't be provided at container runtime only. `docker-compose.prod.yml` forwards `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` from your shell or `.env` as build args. See [Error tracking (Sentry) build args](#error-tracking-sentry-build-args).

**2. Start the full stack:**

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

`docker-entrypoint.sh` runs `prisma migrate deploy` automatically before starting the server, so migrations apply on every deploy.

The container runs as the unprivileged `bun` user (not root) and has a `HEALTHCHECK` against Better Auth's `/api/auth/ok` (it answers without touching the database, so it only reports whether the server process is up). `docker ps` shows `healthy`/`unhealthy`. The Inngest image in both compose files is pinned to the same version as the `inngest-cli` dev dependency in `package.json` - bump them together.

**3. Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Logs

The app writes one JSON object per line to stdout (see [`logging.md`](./logging.md)). Docker's default `json-file` driver never deletes anything, so limit it, either globally in the Docker daemon settings or per service:

```yaml
# docker-compose.logging.yml (add with a second -f)
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

This caps the size, not the age. Logs contain user ids and your reverse proxy logs IP addresses, so set a retention period too (see [`gdpr.md`](./gdpr.md)).

> **Note:** `DATABASE_URL`, `REDIS_URL`, and `INNGEST_BASE_URL` are overridden inside `docker-compose.prod.yml` to Docker-internal hostnames (`postgres`, `redis`, `inngest`). Every other variable is read from your `.env` file. During the image build, `SKIP_ENV_VALIDATION=1` bypasses Zod env validation (there's no real `.env` at build time) - validation runs for real when the container starts.

### Error tracking (Sentry) build args

The `Dockerfile` declares `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (optional, default `0.1` in production), `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` as build args in the `builder` stage, and `docker-compose.prod.yml` fills them from your environment (empty by default, which leaves Sentry off). The auth token only exists in the builder stage and does not end up in the final runner image. If you build without compose:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://...@o0.ingest.sentry.io/0 \
  --build-arg SENTRY_ORG=my-org --build-arg SENTRY_PROJECT=my-project \
  --build-arg SENTRY_AUTH_TOKEN=sntrys_... -t my-app .
```

Any other `NEXT_PUBLIC_*` variable that the *client* bundle reads needs the same treatment (build arg + `ENV` in the builder stage).

## Inngest in production

`docker-compose.prod.yml` runs Inngest in production mode (`inngest start`), not as the dev server:

- **Signed requests.** The `inngest` container and the app share two secrets. `INNGEST_EVENT_KEY` signs the events the app sends, `INNGEST_SIGNING_KEY` lets `/api/inngest` verify that calls come from your Inngest server, so nobody else can trigger your functions. Generate both once and put them in `.env` (compose reads them from there for the `inngest` service, the app gets them through `env_file`):

  ```bash
  openssl rand -hex 32   # run twice: INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
  ```

  The app refuses to start in production without both, and `docker compose` refuses to start the `inngest` service without them.
- **Durable storage.** Queued and running jobs survive restarts: Inngest uses its own Postgres database `inngest_db` (created by `docker/inngest-init.sql` on the first start of an empty Postgres volume) and Redis database `1`. If your Postgres volume already has data, create the database once by hand: `docker compose -f docker-compose.prod.yml exec postgres psql -U saas -c "CREATE DATABASE inngest_db"`.
- **Not public by default.** Port `8288` is published on `127.0.0.1` only. The dashboard has no login, so never expose it unprotected. The browser only needs the Realtime endpoint (`NEXT_PUBLIC_INNGEST_BASE_URL`, used by `/demo/inngest`): expose just that through your reverse proxy, or put the whole thing behind basic auth or a VPN.
- **Local development is unchanged.** `docker-compose.yml` still runs the unauthenticated dev server and needs no keys (`NODE_ENV` is not `production`, so the SDK runs in dev mode).

Running `bun run build && bun run start` locally uses `NODE_ENV=production` and therefore needs both keys and a reachable signed Inngest server. For a quick local check use `bun run dev`.

> The flags of `inngest start` (`--event-key`, `--signing-key`, `--postgres-uri`, `--redis-uri`) belong to the pinned image version. After bumping the image, check `docker run --rm inngest/inngest:<version> inngest start --help`.

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
- [ ] Log rotation and retention configured, `LOG_LEVEL` not left at `debug` (see [Logs](#logs))
- [ ] `BETTER_AUTH_URL` set to your production domain
- [ ] OAuth redirect URIs updated in Google / GitHub developer consoles
- [ ] Polar product ID replaced in `src/lib/auth.ts`
- [ ] `NEXT_PUBLIC_INNGEST_BASE_URL` points at a URL the browser can actually reach (not a Docker-internal hostname)
- [ ] If using Sentry: `NEXT_PUBLIC_SENTRY_DSN` (and the source map vars) passed as build args, not just runtime env
- [ ] Security headers (`next.config.ts`) are conservative on purpose (no `script-src`). If you need a full Content-Security-Policy, add per-request nonces through a proxy - a static `script-src` breaks Next.js' inline scripts
- [ ] PWA: replaced the placeholder icons and checked `public/sw.js` caching rules (see [Integrations](./integrations.md#pwa-installable-app))
- [ ] `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` generated and set (`openssl rand -hex 32`, see [Inngest in production](#inngest-in-production)); port `8288` is not reachable from the internet except the Realtime path

## Optional additions

Intentionally omitted to keep the template lean:

- **Framer Motion** - animations: `bun add framer-motion`
