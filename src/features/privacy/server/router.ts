import { TRPCError } from "@trpc/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"

/**
 * Privacy procedures, mounted at `trpc.privacy.*`: the user's own active
 * sessions and signing devices out. Everything is scoped to the signed-in user
 * in the Prisma `where`. Deleting the account and exporting the data are not
 * here: deletion is Better Auth's `deleteUser`, the export a Route Handler
 * (`src/app/api/account/export/route.ts`).
 */
export const privacyRouter = createTRPCRouter({
  /** The user's active sessions, newest first. Tokens never leave the server, `isCurrent` marks this device. */
  sessions: protectedProcedure.query(async ({ ctx }) => {
    const rows = await prisma.session.findMany({
      where: { userId: ctx.auth.user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    return rows.map(({ token, ...session }) => ({
      ...session,
      isCurrent: token === ctx.auth.session.token,
    }))
  }),

  /** Signs one other device out. The current session is excluded, signing out is `useSignOut()`. */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await prisma.session.deleteMany({
        where: {
          id: input.sessionId,
          userId: ctx.auth.user.id,
          NOT: { token: ctx.auth.session.token },
        },
      })
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" })
    }),

  /** Signs out every device except the current one. */
  revokeOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const { count } = await prisma.session.deleteMany({
      where: {
        userId: ctx.auth.user.id,
        NOT: { token: ctx.auth.session.token },
      },
    })
    return { count }
  }),
})
