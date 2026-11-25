# Logging

Server-side logging is structured, based on [pino](https://getpino.io). In production every line is one JSON object on stdout, so Docker, Vercel or any log collector can search it by field. In development the same lines are printed readably and in color (`pino-pretty`).

```json
{"level":"warn","time":"2026-11-25T20:01:40.173Z","component":"trpc","requestId":"test-abc-12345","procedure":"user.me","type":"query","durationMs":2,"code":"UNAUTHORIZED","msg":"Procedure rejected"}
```

## Using the logger

The logging code lives in `src/lib/logging/`:

| File | Content |
|---|---|
| `logger.ts` | pino configuration, `logger`, `createLogger()` |
| `context.ts` | The ids per request: `runWithLogContext()`, `getLogContext()`, `addLogContext()`, `setLogUserId()` |
| `redaction.ts` | What must not be written: `scrubText()`, `serializeError()`, the redacted field names |
| `library-calls.ts` | `logLibraryCall()`, the adapter for Better Auth and Inngest |
| `request-logging.ts` | `withRequestLogging()` for Route Handlers |
| `request-id.ts` | The `x-request-id` header, shared with `src/proxy.ts` |

Import these files directly and do not add an `index.ts` that re-exports them: `src/proxy.ts` needs only `request-id.ts`, and an index would pull pino and `logger.ts` into it.

pino brings neither of the two things most of this code is for: its default error serializer copies every property of an error, and its `redact` option only works on field paths, not on text.

Create one logger per module with `createLogger` from `@/lib/logging/logger`:

```ts
import { createLogger } from "@/lib/logging/logger"

const log = createLogger("invoices")

log.info({ invoiceId }, "Invoice created")
log.error({ err: error, userId }, "Could not create the invoice")
```

- **The message is constant text.** Variable values go into fields, so you can search for the message and filter by field.
- **Errors go into `err`.** Only this key is cleaned by the error serializer (see below). Never put an error or its message into the message string.
- **Ids, not people.** Log user ids and record ids, never names, emails, request bodies, form inputs, AI prompts or model outputs.
- **Server only.** Client components keep using `console`.
- `console` is a lint error (Biome `noConsole`). The exceptions in `biome.json` are the browser code (`pwa-register.tsx`, `config/sentry.ts`, `sw.js`) and the seed script.

| Level | Use it for |
|---|---|
| `fatal` | The app cannot start (invalid environment variables) |
| `error` | Something failed that should not have, someone should look at it |
| `warn` | Expected but noteworthy: rejected procedure calls, 5xx responses, email not configured |
| `info` | Normal events, such as the one line per API request |
| `debug` | Detail for development: successful procedure calls, Inngest job runs |
| `trace` | Successful routine calls (Inngest sync, health check, session lookup), hidden unless you ask for them |

Set the threshold with `LOG_LEVEL` (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`). The default is `info` in production and `debug` in development. Allowed values and defaults live in one Zod schema, `logLevelSchema` in `src/config/log-level.ts`. It is part of the env schema, so an invalid value stops the startup. The logger parses it on its own because it cannot import `env.ts`, which logs through the logger.

## Request ids

Every line written while a request is handled carries the same `requestId`, and signed-in requests also carry `userId`. No logger has to be passed around.

1. `src/proxy.ts` gives each request an id and returns it in the `x-request-id` response header. An id that a reverse proxy in front of the app already set is kept, if it is 8 to 128 characters of `A-Z a-z 0-9 . _ : -`.
2. `withRequestLogging` (Route Handlers) and the tRPC logging middleware store the id in an `AsyncLocalStorage`. The logger adds it to every line, including work that was started during the request, such as fire-and-forget emails.

When a user reports a failed action, take `x-request-id` from the browser's network tab and search the logs for it.

Code that runs during page rendering outside of tRPC has no stored context, so its lines have no `requestId`. Unhandled errors there still get one (see below). Inngest functions run in requests that the Inngest server makes, so they get their own ids, not the id of the request that sent the event. To follow a job, use its run id (below).

## Following a background job

One job run is many HTTP requests (one per step, and `publish()` is a step too), each with its own `requestId`. The middleware in `src/inngest/logging.ts` ties them together:

| You want to know | Search for |
|---|---|
| All lines of one run | `runId`. While a function runs, the request's later lines carry `runId`, `eventId` and the event's `userId` (if it has one), including the access line |
| Which run an action started | Every sent event is logged as `Events sent` with `eventNames` and `eventIds`. The line has the sender's `requestId` and `userId`. Without a signed-in sender (sign-up) the `userId` comes from the event. Search for the `eventId` to find the run |
| Which action started a run | The other way round: take the `eventId` of a run line and find its `Events sent` line |

One event can start several functions, so one `eventId` can lead to several `runId`s. Cron runs have no sending line and no `userId`. Lines the SDK writes before the run starts (for example a rejected signature) have no `runId`.

**Searching for a `userId` therefore finds a user's requests and job runs.** Put the id of the affected user into the `userId` field of every event that concerns one, it is the only thing the logs read from an event payload. Job logs are personal data like the other logs (see [GDPR](./gdpr.md)).

### Logging inside a job

Use the `logger` that Inngest passes to the function. The function starts from the top on every request, and this logger stays quiet while finished steps are replayed, so messages do not repeat. A logger from `createLogger()` would write them again each time (inside a `step.run` it is fine, a finished step does not run again).

```ts
async ({ event, step, logger }) => {
  const report = await step.run("generate-report", () => buildReport())
  logger.info({ reportId: report.id, rows: report.rows }, "Report generated")
}
```

**Of the object only numbers, booleans, errors and ids (keys ending in `Id`) are written.** Other strings, nested objects and arrays are dropped without a notice, see below.

## What is logged automatically

| Source | Lines | Where |
|---|---|---|
| Route Handlers | Method, path, status, duration. Successful routine calls (`/api/auth/ok`, `/api/auth/get-session`, `GET`/`PUT /api/inngest`) only at `trace`; `POST /api/inngest` (a job step) and 4xx answers on these paths at `debug`; 5xx always `warn`. In development, `logging.incomingRequests` in `next.config.ts` also hides Next.js' own line for the Inngest sync | `src/lib/logging/request-logging.ts` |
| tRPC procedures | `INTERNAL_SERVER_ERROR` as `error` with the error, other failures as `warn` with the code, successes as `debug`. Also covers server-side calls during rendering | `src/trpc/init.ts` |
| Unhandled server errors | Error, path without query string, route, request id. Also sent to Sentry if configured | `onRequestError` in `src/instrumentation.ts` |
| Better Auth and Inngest SDK | Their messages, with `component: "auth"` or `"inngest"` | `src/lib/auth.ts`, `src/inngest/client.ts` |
| Sent Inngest events | `Events sent` with names and ids, never the payload | `src/inngest/logging.ts` |

Page requests have no access line. If you need one for every request, take it from your reverse proxy and let it set `x-request-id`.

### A new Route Handler

Wrap every handler under `src/app/api/` and add the user id once the session is known:

```ts
export const POST = withRequestLogging(async (req: Request) => {
  const session = await getSessionOnServer()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  setLogUserId(session.user.id)
  // ...
})
```

tRPC procedures need nothing: every procedure builds on `baseProcedure`, which logs, and `protectedProcedure` sets the user id.

## Keeping personal data and secrets out

Logs are copied to places you do not control as tightly as your database, so the logger protects against the usual leaks. See also [GDPR](./gdpr.md).

- **Errors are serialized with an allow list.** Only type, message, stack frames, `code`, `status`, `statusCode`, `digest` and the cause chain are written. pino's default would copy every property, and SDK errors carry request and response bodies, headers with API tokens or AI prompts there. Of Prisma validation errors only the last message line is kept, because the rest is the query with its values.
- **Free text is scrubbed** (`scrubText()`) in error messages, stacks, paths and library messages: email addresses (also URL-encoded), credentials written as `name=value` or `"name": "value"` whose name contains `token`, `secret`, `password`, `passwd` or `api_key`/`apiKey` (so also `access_token`, `refresh_token`, `client_secret`), `code`/`state`/`key` query parameters, password reset tokens in paths, `Bearer` tokens and credentials in connection strings. It does **not** recognize names, IP addresses, phone numbers or a credential without such a label (`Invalid token abc123`).
- **Fields named** `password`, `token`, `secret`, `apiKey`, `accessToken`, `refreshToken`, `idToken`, `clientSecret` (and their `snake_case` forms), `email`, `authorization` and `cookie` are redacted, at the top level and one level down.
- **Query strings and tRPC inputs are never logged.**
- **Of objects passed by Better Auth and Inngest** (and to `ctx.logger` in jobs) only errors, numbers, booleans and string ids (keys ending in `Id`) are kept next to the text. Never put personal data into a field whose name ends in `Id`.

The filters are covered by tests (`redaction.test.ts`, `library-calls.test.ts`, run with Vitest through `bun run test`, also in CI; `bun run test:watch` re-runs them on changes). When you change or add a rule, add a case for what it must remove **and** one for similar harmless text it must leave alone. They use made-up values only.

This is a safety net, not a guarantee. Scrubbing does not touch the message string or the fields of your own log calls, and it cannot recognize a name or other free text inside an error message.

Two things bypass it:

- **Next.js itself** still prints uncaught errors to stderr as plain, unfiltered text, next to the structured line from `onRequestError`.
- **The local email fallback:** without Resend, development builds print the whole email including its one-time link, so you can click it. Production logs only the subject.

## In production

The app only writes to stdout. Collecting, storing and deleting logs is the job of the platform. For Docker, read them with `docker compose -f docker-compose.prod.yml logs -f app`, and limit their size and age (see [Deployment](./deployment.md#logs)). For a hosted log service (Grafana Loki, Better Stack, Axiom, Datadog, ...) ship the container output with its agent, no code change needed.

`pino-pretty` is used as a plain stream instead of a pino `transport`: transports run in worker threads, which do not work reliably inside the Next.js bundle. Keep that in mind before adding a transport.
