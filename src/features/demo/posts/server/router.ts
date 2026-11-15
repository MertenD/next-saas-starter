import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  createPostSchema,
  updatePostSchema,
} from "@/features/demo/posts/schema/post-schema"
import prisma from "@/lib/db"
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init"

/** Upper bound for `getMany`, so one user can never make the endpoint return an unbounded list. */
const MAX_POSTS = 100

/** Prisma error code "record to update/delete not found" (also raised when the extra `userId` filter does not match). */
function isRecordNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  )
}

export const postsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return prisma.post.findMany({
      where: { userId: ctx.auth.user.id },
      orderBy: { createdAt: "desc" },
      take: MAX_POSTS,
    })
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await prisma.post.findFirst({
        where: { id: input.id, userId: ctx.auth.user.id },
      })
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      return post
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.post.create({
        data: { ...input, userId: ctx.auth.user.id },
      })
    }),

  // Ownership is part of the `where`, so check and write are one database
  // round trip. A foreign or missing post raises P2025, mapped to NOT_FOUND.
  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      try {
        return await prisma.post.update({
          where: { id, userId: ctx.auth.user.id },
          data,
        })
      } catch (error) {
        if (isRecordNotFound(error)) throw new TRPCError({ code: "NOT_FOUND" })
        throw error
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await prisma.post.delete({
          where: { id: input.id, userId: ctx.auth.user.id },
        })
      } catch (error) {
        if (isRecordNotFound(error)) throw new TRPCError({ code: "NOT_FOUND" })
        throw error
      }
    }),

  // Example of a premium-gated procedure
  bulkPublish: premiumProcedure.mutation(async ({ ctx }) => {
    return prisma.post.updateMany({
      where: { userId: ctx.auth.user.id, published: false },
      data: { published: true },
    })
  }),
})
