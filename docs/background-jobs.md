# Background Jobs (Inngest)

[Inngest](https://www.inngest.com) runs durable, multi-step background jobs: each `step.run()` is checkpointed and retried independently on failure, and `step.sleep()` survives server restarts. This template talks only to a **self-hosted** Inngest instance (the `inngest/inngest` Docker image) - never Inngest Cloud.

## Local development

1. **Start the dev server.** `docker compose up -d` already starts it (see [`getting-started.md`](./getting-started.md)) - no extra step needed. It polls your app's `/api/inngest` route to discover functions. Not using Docker? Run `bun run inngest:dev`, or `bun run dev:all` to run it alongside Next.js via `mprocs`.
2. **Open the dashboard** at [http://localhost:8288](http://localhost:8288) to watch runs execute step-by-step, inspect payloads, and replay failed runs.
3. **Try the built-in demo.** Log in, go to `/demo/inngest`, click "Trigger Job" - it sends an event via a tRPC mutation (`src/features/demo/inngest/server/router.ts`), which Inngest picks up and runs through `demoJob`. Watch it execute live on the dashboard.
4. **Functions are registered** in `src/app/api/inngest/route.ts` via `serve({ client: inngest, functions: [...] })` - every new function must be added to that array to be discoverable.

## The Inngest client

`src/inngest/client.ts`:

```typescript
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  middleware: [realtimeMiddleware()],
  isDev: true,
});
```

`isDev: true` is hardcoded intentionally, not a leftover dev setting - the in-code comment explains why: since this app only ever talks to a self-hosted Inngest instance, forcing dev mode regardless of `NODE_ENV` keeps the SDK from assuming Inngest Cloud and demanding an `INNGEST_EVENT_KEY`. It targets whatever `INNGEST_BASE_URL` points at (or `localhost:8288` by default). See [`deployment.md`](./deployment.md) for what this means for production hardening.

## Existing jobs

Both defined in `src/inngest/functions.ts`, triggered by events in the `InngestEvents` enum:

- **`onUserSignedUp`** (`UserSignedUp` event) - sleeps 1s and returns a welcome message. Stubbed with a `TODO` for real logic (sending a welcome email, provisioning resources, etc.) - not currently wired to fire from the sign-up flow itself.
- **`demoJob`** (`DemoTriggered` event) - the `/demo/inngest` job. Three steps: `fetch-stats` (simulated async fetch), `processing-delay` (a `step.sleep("processing-delay", "5s")` to demonstrate durable scheduling), `generate-report`. Publishes live progress at each stage over Inngest Realtime via `demoJobChannel` (`src/inngest/realtime.ts`, topic `"status"`), and publishes a `failed` status before rethrowing on error.

## Realtime subscriptions

The `demoJob` pattern for streaming status to the browser without polling:

1. Server publishes updates during the job: `await publish(channel.status({ status, message, ... }))`.
2. A tRPC query issues a short-lived subscription token scoped to one channel: `getSubscriptionToken(inngest, { channel, topics: ["status"] })` (see `demo/inngest/server/router.ts`).
3. The client subscribes with `useInngestSubscription` from `@inngest/realtime/hooks`, passing a `refreshToken` callback that re-fetches that token.

This requires `NEXT_PUBLIC_INNGEST_BASE_URL` to be set to a URL the *browser* can reach - see [`environment-variables.md`](./environment-variables.md).

## Adding a new job

Add new functions in `src/inngest/functions.ts`:

```typescript
export const sendWeeklyDigest = inngest.createFunction(
  { id: "send-weekly-digest" },
  { cron: "0 9 * * 1" }, // every Monday at 9am
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.user.findMany({ select: { email: true } });
    });
    // process users...
    return { processed: users.length };
  },
);
```

Then register it in `src/app/api/inngest/route.ts`'s `functions: [...]` array.
