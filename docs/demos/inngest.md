# Demo: Background Jobs

**Route:** `/demo/inngest` · **Feature module:** `src/features/demo/inngest/`

## What this demonstrates

Triggering a durable, multi-step background job from a UI action, then streaming its live progress back to that exact browser tab via Inngest Realtime - no polling loop, no manual WebSocket plumbing.

## Key files

| File | Role |
|---|---|
| `model/inngest-demo.ts` | `Run` type, `JOB_STEPS` step metadata |
| `schema/inngest-demo-schema.ts` | `getJobSubscriptionTokenSchema` |
| `server/router.ts` | `triggerDemoJob` (send event), `getJobSubscriptionToken` (Realtime auth) |
| `hooks/use-demo-job-runs.ts` | Trigger mutation + local run list, toasts |
| `hooks/use-job-status.ts` | Wraps `useInngestSubscription` for one run |
| `components/inngest-demo-container.tsx` | Composes the cards below, owns `useDemoJobRuns()` |
| `components/job-steps-card.tsx` | Step list + trigger button |
| `components/run-history-card.tsx` | Triggered-run list, empty state |
| `components/run-status-badge.tsx` | Live status badge for one run |
| `components/how-it-works-card.tsx` | Static explainer card |
| `src/inngest/functions.ts` | `demoJob` - the actual multi-step job |
| `src/inngest/realtime.ts` | `demoJobChannel` - the Realtime channel/topic definition |
| `src/inngest/client.ts` | Inngest client instance |
| `src/app/(dashboard)/demo/inngest/page.tsx` | Page heading, delegates to `InngestDemoContainer` |
| `src/app/api/inngest/route.ts` | Registers functions with the Inngest dev server |

## How it works

1. **Trigger decouples "what happened" from "what runs."** Clicking "Trigger Job" calls the `demo.triggerDemoJob` tRPC mutation, which does `inngest.send({ name: InngestEvents.DemoTriggered, data: { triggeredBy } })` - it hands an event to the Inngest server rather than calling the job function directly. Inngest then invokes `demoJob` in response.

2. **Durable multi-step execution.** `demoJob` runs three steps, each independently checkpointed:

   ```ts
   const stats = await step.run("fetch-stats", async () => { /* simulated ~600ms fetch */ })
   await step.sleep("processing-delay", "5s") // survives a server restart mid-job
   const report = await step.run("generate-report", async () => { /* build summary */ })
   ```

   `step.sleep` is the notable one: an in-memory `setTimeout` would be lost if the process restarted mid-wait, but Inngest's durable execution model resumes the job from that exact point even across a restart.

3. **Scoped live progress.** At each step transition, the job publishes a status update to a channel scoped to that one run: `demoJobChannel(demoJobKey(userId, event.id))` from `src/inngest/realtime.ts`. Because the channel key combines the triggering user's id and the event id, status updates from one triggered run never leak into another run's UI, even if you trigger several back to back.

4. **Client subscribes, doesn't poll.** Each triggered run in the UI renders a `RunStatusBadge` (`components/run-status-badge.tsx`) using `hooks/use-job-status.ts`, which wraps `useInngestSubscription` (`@inngest/realtime/hooks`). Its `refreshToken` callback fetches a short-lived, run-scoped token via the `demo.getJobSubscriptionToken` tRPC query (which wraps `getSubscriptionToken()` from `@inngest/realtime`, itself scoped to that run's channel/topic; the server builds the channel key from the session's user id, so a user can only get a token for their own runs). The badge then updates as `publish()` calls land server-side - there's no interval or refetch loop anywhere in this flow.

5. **Registration.** Every Inngest function must be added to `serve({ functions: [...] })` in `src/app/api/inngest/route.ts` to be discoverable by the dev server - a function that exists in code but isn't in that array simply never runs.

## Try it

Open `/demo/inngest`, click "Trigger Job", and watch the badge move through *running → completed* live. Open the [Inngest dashboard](http://localhost:8288) alongside it to see the same run traced step-by-step, including the 5-second sleep.

## Related docs

- [Background Jobs](../background-jobs.md) - the full Inngest reference: concepts, adding new jobs, and why `isDev: true` is hardcoded in `src/inngest/client.ts`
- [Environment Variables](../environment-variables.md) - `NEXT_PUBLIC_INNGEST_BASE_URL`, required for the Realtime subscription to reach the Inngest server from the browser
