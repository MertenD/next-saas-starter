# Integrations

Smaller bolt-on integrations that don't warrant their own page: AI, Redis, analytics, Sentry (error tracking) and PWA support.

## AI (OpenRouter)

`src/lib/ai.ts` exports an OpenRouter provider client and the configured model:

```typescript
export const openrouter = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
export const AI_MODEL = env.AI_MODEL; // defaults to google/gemini-2.5-flash
```

Use it with the Vercel AI SDK's `streamText`:

```typescript
import { streamText } from "ai";
import { openrouter, AI_MODEL } from "@/lib/ai";

const result = await streamText({
  model: openrouter(AI_MODEL),
  system: "You are a helpful assistant.",
  prompt: userMessage,
});
return result.toUIMessageStreamResponse();
```

The `/demo/ai` chat feature (`src/features/demo/ai/`) also demonstrates **resumable streams** via `src/lib/stream-context.ts` (`getStreamContext()`, wrapping `resumable-stream`'s `createResumableStreamContext`) - a chat response keeps streaming server-side even if the client disconnects, and `/api/chat/[id]/stream` lets the client resume it. See [`features.md`](./features.md).

Requires `OPENROUTER_API_KEY` - see [`environment-variables.md`](./environment-variables.md).

## Redis

`src/lib/redis.ts` exports a lazy-connecting singleton client:

```typescript
import { getRedis } from "@/lib/redis";

const redis = await getRedis();
await redis.set("key", "value", { EX: 3600 }); // expires in 1 hour
const value = await redis.get("key");
```

Like the Prisma client, it's cached on `global` in development to survive HMR without exhausting connections.

## Analytics (Plausible)

The template integrates [Plausible](https://plausible.io) - a lightweight, cookie-free analytics tool - via [`next-plausible`](https://github.com/4lejandrito/next-plausible). Works with both Plausible Cloud and a self-hosted instance.

**Setup:** set `NEXT_PUBLIC_PLAUSIBLE_SRC` in `.env` to your site's script URL (e.g. `https://plausible.io/js/script.js`, or `https://your-instance.tld/js/script.js` for self-hosted). Leave it unset to disable analytics entirely - no script is rendered, and `<PlausibleProvider>` in `src/app/layout.tsx` becomes a no-op.

Automatic pageview tracking is enabled by default once the env var is set - no extra code needed.

### Custom events

Goal events (sign-ups, upgrade clicks, etc.) are tracked via the `usePlausible` hook, typed against `PlausibleEvents` in `src/lib/analytics.ts`:

```typescript
// src/lib/analytics.ts
export type PlausibleEvents = {
  "Sign Up": never;
  Login: never;
  "Upgrade Clicked": never;
  "My New Event": { plan: string }; // events can carry props too
};
```

Fire it from a Client Component:

```typescript
import { usePlausible } from "next-plausible";
import type { PlausibleEvents } from "@/lib/analytics";

const plausible = usePlausible<PlausibleEvents>();
plausible("My New Event", { props: { plan: "pro" } });
```

The template already tracks `Sign Up` (`register-form.tsx`), `Login` (`login-form.tsx`), and `Upgrade Clicked` (`user-info-card.tsx`) as working examples.

## Error tracking (Sentry)

Optional. The template ships the [Sentry](https://sentry.io) wiring for Next.js, but it stays completely off until you set `NEXT_PUBLIC_SENTRY_DSN`: `next.config.ts` skips `withSentryConfig`, and the server, edge and browser configs are not loaded or initialized at all. This matters because even a disabled `Sentry.init` installs OpenTelemetry instrumentation that patches `fetch` and can break outgoing requests.

**Setup:** create a Next.js project in Sentry and set `NEXT_PUBLIC_SENTRY_DSN` in `.env`. To get readable stack traces in production, also set `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` - they are only used while running `next build` to upload source maps.

**Where the pieces live:**

| File | Role |
|---|---|
| `src/instrumentation.ts` | Next.js instrumentation hook: loads the server or edge config, exports `onRequestError` (sends errors from Server Components, Route Handlers and Server Actions to Sentry and to the [logs](./logging.md)) |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | Server and Edge runtime init (the server config also traces Vercel AI SDK calls) |
| `src/instrumentation-client.ts` | Browser init (Session Replay is off by default, see [`gdpr.md`](./gdpr.md#sentry-session-replay-is-off)) |
| `src/app/global-error.tsx` | Last-resort error page. Reports to Sentry and picks its text (`globalError` in `messages/*.json`) from the browser language, because it renders without the i18n provider |
| `next.config.ts` | Wraps the config with `withSentryConfig` (source maps, `/monitoring` tunnel route that avoids ad-blockers) when a DSN is set |

**Things to know:**

- `NEXT_PUBLIC_SENTRY_DSN` is inlined into the browser bundle at **build time**. With Docker it is passed as a build arg - see [Deployment](./deployment.md#error-tracking-sentry-build-args).
- `tracesSampleRate` comes from one helper, `getTracesSampleRate()` in `src/config/sentry.ts`, used by the browser, server and edge inits. Set `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (`0` to `1`) to change it; without it the default is `1` (every request) in development and `0.1` in production. The value is inlined into the browser bundle at build time, so with Docker it is a build arg (like the DSN). Use `tracesSampler` if you need finer control.
- `vercelAIIntegration` records AI prompts and model outputs only when `SENTRY_RECORD_AI_DATA=1` is set (off by default, because they can contain personal data). Token counts, timings and errors are traced either way.
- `sentry.edge.config.ts` is dormant: the template has no Edge code (`runtime = "edge"` routes; `src/proxy.ts` runs on Node). It is kept so Edge errors get reported as soon as you add some.
- The `@sentry/nextjs` v11 import for the build wrapper is `@sentry/nextjs/config` (see `next.config.ts`).

## PWA (installable app)

The app is installable ("Add to home screen") and already-visited pages keep opening offline. The service worker has its own page with the details (strategies, updates, privacy, debugging): [Service Worker](./service-worker.md).

| Piece | Role |
|---|---|
| `src/app/manifest.ts` | Web app manifest (name from `APP_NAME`, `start_url: /dashboard`, standalone display, theme color) |
| `src/app/api/pwa-icon/route.tsx` | Generates placeholder icons (first letter of `APP_NAME` on the brand color) at the sizes the manifest asks for |
| `public/sw.js` | Hand-written service worker: cache-first for `/_next/static/*`, network-first with offline fallback for page navigations (the cached copy is used after a 4 s network timeout, so a hanging connection does not block the page), never touches `/api/*`. Both caches are capped (150 static files, 30 pages, oldest evicted first) so they cannot grow without bound across deployments |
| `src/components/pwa-register.tsx` | Registers the service worker, in production only (a service worker in `next dev` serves stale bundles) |
| `src/lib/pwa.ts` | `clearPwaPageCache()`, called on sign-out |

**Why no `next-pwa`/Workbox plugin?** Next.js 16 builds with Turbopack, and the webpack-based PWA plugins do not support it. The service worker is plain JS with no build step. If you need precaching or background sync, look at Serwist's Turbopack support.

**Before you ship:**

- Replace the generated icons with real PNGs in `public/` and point `manifest.ts` at them.
- Bump `VERSION` in `public/sw.js` whenever you change its caching rules, so clients drop the old caches.
- Cached pages are user-specific HTML. `clearPwaPageCache()` removes them on sign-out, but think about this if you add other ways to end a session. Sign out through `useSignOut()` (`src/features/auth/hooks/use-sign-out.ts`), which also clears the React Query cache and its IndexedDB copy.
- Test it with `bun run build && bun run start`, not `bun run dev`.
