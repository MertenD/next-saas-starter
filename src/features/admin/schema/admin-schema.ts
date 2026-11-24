import { z } from "zod"
import { ASSIGNABLE_ROLES, PAGINATION } from "@/config/constants"

export const adminUsersQuerySchema = z.object({
  page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z
    .number()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  search: z.string().default(""),
})

export type AdminUsersQueryInput = z.infer<typeof adminUsersQuerySchema>

export const adminUserIdSchema = z.object({ userId: z.string().min(1) })

export const setUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ASSIGNABLE_ROLES),
})
