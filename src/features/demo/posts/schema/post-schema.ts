import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
});

export const updatePostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
