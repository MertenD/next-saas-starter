import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { isPolarEnabled, polarClient } from "@/lib/polar";

export const createTRPCContext = cache(async () => {
  return {};
});

const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

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
