import { initTRPC, TRPCError } from "@trpc/server"
import { headers } from "next/headers"
import { cache } from "react"
import superjson from "superjson"
import { isAdminRole } from "@/config/constants"
import {
  getPolarCustomerState,
  getSessionOnServer,
  hasActiveSubscription,
} from "@/lib/auth-utils"
import {
  getLogContext,
  runWithLogContext,
  setLogUserId,
} from "@/lib/logging/context"
import { createLogger } from "@/lib/logging/logger"
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/logging/request-id"

const log = createLogger("trpc")

/**
 * Builds the per-request tRPC context. Wrapped in React's `cache()` so it's
 * computed once per request and shared across every procedure call within
 * that request (including from `src/trpc/server.tsx`'s server-side caller).
 * Session/auth data is intentionally *not* put here - each procedure fetches
 * it itself via `headers()` so it stays correct even under `cache()`.
 */
export const createTRPCContext = cache(async () => {
  return {}
})

const t = initTRPC.create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

/**
 * Logs the outcome of every procedure call, for HTTP requests as well as for
 * server-side calls during rendering (which get their request context here).
 * Internal errors are logged with the error, expected ones (unauthorized, not
 * found, invalid input) as a warning without it. Inputs are never logged.
 */
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const context = getLogContext() ?? {
    requestId: resolveRequestId((await headers()).get(REQUEST_ID_HEADER)),
  }

  return runWithLogContext(context, async () => {
    const startedAt = performance.now()
    const result = await next()
    const fields = {
      procedure: path,
      type,
      durationMs: Math.round(performance.now() - startedAt),
    }

    if (result.ok) {
      log.debug(fields, "Procedure succeeded")
    } else if (result.error.code === "INTERNAL_SERVER_ERROR") {
      log.error({ ...fields, err: result.error }, "Procedure failed")
    } else {
      log.warn({ ...fields, code: result.error.code }, "Procedure rejected")
    }

    return result
  })
})

/** Public procedure builder: no auth required, calls are logged. Base for the procedures below. */
export const baseProcedure = t.procedure.use(loggingMiddleware)

/**
 * Procedure builder that requires a signed-in user. Throws `UNAUTHORIZED`
 * when there's no session, otherwise attaches the session to `ctx.auth`.
 * Use for any endpoint that reads/writes user-specific data.
 */
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  // Cached per request: during SSR prefetch the layout and every procedure
  // share one session lookup instead of each doing their own.
  const session = await getSessionOnServer()

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  }

  setLogUserId(session.user.id)

  return next({ ctx: { ...ctx, auth: session } })
})

/**
 * Procedure builder for the admin area: a {@link protectedProcedure} that also
 * requires the `admin` role (checked against the session, so a demoted admin
 * loses access with the next request). Throws `FORBIDDEN` for everyone else.
 * Every procedure under `trpc.admin.*` must use it.
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!isAdminRole(ctx.auth.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin role required" })
  }

  return next()
})

/**
 * Procedure builder that additionally requires an active Polar subscription
 * on top of {@link protectedProcedure}'s auth check. Throws `FORBIDDEN` when
 * the user has no active subscription. When Polar isn't configured, premium
 * access is granted unconditionally (local dev / mock mode) and
 * `ctx.customer` is `null`.
 */
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // A failing Polar API call is treated like "no subscription".
    const customer = await getPolarCustomerState(ctx.auth.user.id).catch(
      (error: unknown) => {
        log.error(
          { err: error },
          "Could not load the Polar customer, premium access denied",
        )
        return undefined
      },
    )

    // When Polar is not configured (`null`), grant premium access (local dev / mock mode)
    if (customer === null) {
      return next({ ctx: { ...ctx, customer: null } })
    }

    if (!customer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active Subscription required",
      })
    }

    if (!hasActiveSubscription(customer)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active Subscription required",
      })
    }

    return next({ ctx: { ...ctx, customer } })
  },
)
