import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { isPolarEnabled, polarClient } from "@/lib/polar";

/**
 * Builds the per-request tRPC context. Wrapped in React's `cache()` so it's
 * computed once per request and shared across every procedure call within
 * that request (including from `src/trpc/server.tsx`'s server-side caller).
 * Session/auth data is intentionally *not* put here - each procedure fetches
 * it itself via `headers()` so it stays correct even under `cache()`.
 */
export const createTRPCContext = cache(async () => {
  return {};
});

const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Public procedure builder: no auth required. Base for the procedures below. */
export const baseProcedure = t.procedure;

/**
 * Procedure builder that requires a signed-in user. Throws `UNAUTHORIZED`
 * when there's no session, otherwise attaches the session to `ctx.auth`.
 * Use for any endpoint that reads/writes user-specific data.
 */
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});

/**
 * Procedure builder that additionally requires an active Polar subscription
 * on top of {@link protectedProcedure}'s auth check. Throws `FORBIDDEN` when
 * the user has no active subscription. When Polar isn't configured, premium
 * access is granted unconditionally (local dev / mock mode) and
 * `ctx.customer` is `null`.
 */
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // When Polar is not configured, grant premium access (local dev / mock mode)
    if (!isPolarEnabled || !polarClient) {
      return next({ ctx: { ...ctx, customer: null } });
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: typed by Polar SDK after assignment
    let customer;
    try {
      customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
      });
    } catch {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active Subscription required",
      });
    }

    if (
      !customer.activeSubscriptions ||
      customer.activeSubscriptions.length === 0
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active Subscription required",
      });
    }

    return next({ ctx: { ...ctx, customer } });
  },
);
