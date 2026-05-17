# Integrations

Smaller bolt-on integrations that don't warrant their own page.

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
