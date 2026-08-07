import { MOCK_CUSTOMERS } from "@/features/demo/customers/model/customer"
import { customersQuerySchema } from "@/features/demo/customers/schema/customer-query-schema"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"

// Small artificial delay so the demo's loading skeleton is actually visible.
const SIMULATED_LATENCY_MS = 400

export const customersRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(customersQuerySchema)
    .query(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))

      const { page, pageSize, search, status, sortBy, sortOrder } = input

      let filtered = MOCK_CUSTOMERS

      if (status !== "all") {
        filtered = filtered.filter((customer) => customer.status === status)
      }

      if (search) {
        const query = search.toLowerCase()
        filtered = filtered.filter(
          (customer) =>
            customer.name.toLowerCase().includes(query) ||
            customer.email.toLowerCase().includes(query),
        )
      }

      const direction = sortOrder === "asc" ? 1 : -1
      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "totalSpent") {
          return (a.totalSpent - b.totalSpent) * direction
        }
        if (sortBy === "createdAt") {
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            direction
          )
        }
        return a[sortBy].localeCompare(b[sortBy]) * direction
      })

      const totalCount = sorted.length
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
      const start = (page - 1) * pageSize
      const items = sorted.slice(start, start + pageSize)

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
})
