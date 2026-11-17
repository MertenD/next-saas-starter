# ---- deps ----
FROM oven/bun:1-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# ---- builder ----
FROM oven/bun:1-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Skip Zod env validation during build - real validation runs at container startup
ENV SKIP_ENV_VALIDATION=1

# Optional Sentry: the DSN and the trace sample rate are inlined into the browser
# bundle at build time, so they must be build args (not just runtime env vars).
# The auth token is only used to upload source maps; it lives in this builder
# stage only and is not part of the final runner image.
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=$NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

RUN bun run prisma:generate
RUN bun run build

# ---- runner ----
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl

# The app runs as the unprivileged `bun` user that ships with the base image,
# so the files it needs to read (and write, e.g. the Next.js cache) are owned by it.
# Next.js standalone output
COPY --from=builder --chown=bun:bun /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Prisma schema + migrations (for migrate deploy at startup)
COPY --from=builder --chown=bun:bun /app/prisma ./prisma
COPY --from=builder --chown=bun:bun /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules

COPY --chown=bun:bun docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER bun

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Better Auth's `/api/auth/ok` answers 200 without touching the database,
# so this only reports whether the server process itself is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/auth/ok || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
