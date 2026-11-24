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
});
```

There is deliberately no `isDev` option: the SDK infers the mode from `NODE_ENV`. In development it talks to the unauthenticated dev server (`localhost:8288`, started by `docker compose up -d` or `bun run inngest:dev`) and no keys are needed. In production it runs signed: `INNGEST_EVENT_KEY` signs the events the app sends to your self-hosted Inngest server, and `INNGEST_SIGNING_KEY` lets `/api/inngest` verify that calls really come from that server (everything else is rejected). The server address is `INNGEST_BASE_URL`. Both keys are required in production and validated at startup in `src/config/env.ts`. Setup: [`deployment.md`](./deployment.md#inngest-in-production).

## Existing jobs

Both defined in `src/inngest/functions.ts`, triggered by events in the `InngestEvents` constant (`as const` object; use `InngestEventName` for the union type):

- **`onUserSignedUp`** (`UserSignedUp` event) - sleeps 1s and returns a welcome message. Stubbed with a `TODO` for real logic (sending a welcome email, provisioning resources, etc.). The event is sent from the Better Auth `user.create` hook in `src/lib/auth.ts` after a user is created (fire and forget: a down Inngest server is logged, but never makes sign-up fail).
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
