import { TRPCError } from "@trpc/server"
import { headers } from "next/headers"
import {
  adminUserIdSchema,
  adminUsersQuerySchema,
  setUserRoleSchema,
} from "@/features/admin/schema/admin-schema"
import { getBillingStats } from "@/features/admin/server/billing-stats"
import { auth } from "@/lib/auth"
import { getPolarCustomerState } from "@/lib/auth-utils"
import prisma from "@/lib/db"
import { isPolarEnabled, polarClient } from "@/lib/polar"
import { adminProcedure, createTRPCRouter } from "@/trpc/init"

const DAY_MS = 24 * 60 * 60 * 1000

/** Whether an error from the Polar SDK is an HTTP 404 (e.g. no customer exists for this user). */
function isPolarNotFound(error: unknown) {
  return (
    error instanceof Error && "statusCode" in error && error.statusCode === 404
  )
}

/** Throws when `userId` is the caller: admins must not lock themselves out. */
function assertNotSelf(currentUserId: string, userId: string) {
  if (currentUserId === userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You cannot do this to your own account.",
    })
  }
}

/**
 * Deletes the user's Polar customer, which cancels their active subscriptions
 * immediately and revokes their benefits (Polar does NOT refund automatically).
 * Done before the local delete: if Polar fails the user stays, so we never
 * leave a customer that is still being charged without a local account.
 * A missing customer (404) is fine.
 */
async function deletePolarCustomer(userId: string) {
  if (!isPolarEnabled || !polarClient) return

  try {
    await polarClient.customers.deleteExternal({ externalId: userId })
  } catch (error) {
    if (isPolarNotFound(error)) return
    console.error("Error deleting Polar customer:", error)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not delete the Polar customer. The user was not deleted.",
    })
  }
}

/**
 * Admin area procedures, mounted at `trpc.admin.*`. Every procedure is an
 * `adminProcedure`. Role, ban and delete go through the Better Auth admin
 * plugin (`auth.api.*`) so sessions are revoked and its rules apply; lists and
 * counts are plain Prisma queries.
 */
export const adminRouter = createTRPCRouter({
  /** Paginated, searchable user list (name or email contains the search text). */
  users: adminProcedure
    .input(adminUsersQuerySchema)
    .query(async ({ input }) => {
      const { page, pageSize, search } = input
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}

      const [items, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            role: true,
            banned: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ])
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    }),

  /** Overview numbers: user counts from the database, billing numbers live from Polar. */
  stats: adminProcedure.query(async () => {
    const since = new Date(Date.now() - 30 * DAY_MS)
    const [total, newLast30Days, verified, billing] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { emailVerified: true } }),
      getBillingStats(),
    ])

    return { users: { total, newLast30Days, verified }, billing }
  }),

  /**
   * How many active Polar subscriptions a user has. Shown in the ban/delete
   * dialogs, because neither action refunds anything and ban does not touch
   * the subscription at all.
   */
  billing: adminProcedure.input(adminUserIdSchema).query(async ({ input }) => {
    if (!isPolarEnabled) return { polarEnabled: false, activeSubscriptions: 0 }

    try {
      const customer = await getPolarCustomerState(input.userId)
      return {
        polarEnabled: true,
        activeSubscriptions: customer?.activeSubscriptions.length ?? 0,
      }
    } catch (error) {
      if (isPolarNotFound(error)) {
        return { polarEnabled: true, activeSubscriptions: 0 }
      }
      throw error
    }
  }),

  setRole: adminProcedure
    .input(setUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      assertNotSelf(ctx.auth.user.id, input.userId)
      await auth.api.setRole({
        body: { userId: input.userId, role: input.role },
        headers: await headers(),
      })
    }),

  /** Blocks sign-in and ends all sessions. Does NOT touch Polar: a subscription keeps renewing. */
  ban: adminProcedure
    .input(adminUserIdSchema)
    .mutation(async ({ ctx, input }) => {
      assertNotSelf(ctx.auth.user.id, input.userId)
      await auth.api.banUser({
        body: { userId: input.userId },
        headers: await headers(),
      })
    }),

  unban: adminProcedure.input(adminUserIdSchema).mutation(async ({ input }) => {
    await auth.api.unbanUser({
      body: { userId: input.userId },
      headers: await headers(),
    })
  }),

  /** Deletes the Polar customer first (cancels subscriptions), then the user with all their data. */
  remove: adminProcedure
    .input(adminUserIdSchema)
    .mutation(async ({ ctx, input }) => {
      assertNotSelf(ctx.auth.user.id, input.userId)
      await deletePolarCustomer(input.userId)
      await auth.api.removeUser({
        body: { userId: input.userId },
        headers: await headers(),
      })
    }),
})
