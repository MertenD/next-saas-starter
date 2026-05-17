import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPostSchema,
  updatePostSchema,
} from "@/features/demo/posts/schema/post-schema";
import prisma from "@/lib/db";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";

export const postsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return prisma.post.findMany({
      where: { userId: ctx.auth.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await prisma.post.findUnique({ where: { id: input.id } });
      if (!post || post.userId !== ctx.auth.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return post;
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.post.create({
        data: { ...input, userId: ctx.auth.user.id },
      });
    }),

  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post || post.userId !== ctx.auth.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return prisma.post.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await prisma.post.findUnique({ where: { id: input.id } });
      if (!post || post.userId !== ctx.auth.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return prisma.post.delete({ where: { id: input.id } });
    }),

  // Example of a premium-gated procedure
  bulkPublish: premiumProcedure.mutation(async ({ ctx }) => {
    return prisma.post.updateMany({
      where: { userId: ctx.auth.user.id, published: false },
      data: { published: true },
    });
  }),
});
