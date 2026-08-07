import prisma from "@/lib/db";
import { isPolarEnabled } from "@/lib/polar";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";

/**
 * Core user procedures, mounted at `trpc.user.*`. Kept separate from
 * settings/profile mutations (which go through `authClient` directly, see
 * `src/features/user/hooks/use-update-profile.ts`) because those are
 * handled by Better Auth itself rather than custom Prisma queries.
 */
export const userRouter = createTRPCRouter({
  /** The signed-in user's own profile fields. Powers `useCurrentUser`. */
  me: protectedProcedure.query(async ({ ctx }) => {
    return prisma.user.findUnique({
      where: { id: ctx.auth.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }),

  /** Lets client code (e.g. `useHasActiveSubscription`) branch on billing being configured, without leaking server env vars to the client. */
  isPolarEnabled: baseProcedure.query(() => isPolarEnabled),
});
