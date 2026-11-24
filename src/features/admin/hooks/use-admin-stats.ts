"use client"

import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

/** User counts and Polar billing numbers for the admin overview (`trpc.admin.stats`). */
export const useAdminStats = () => {
  const trpc = useTRPC()
  return useQuery(trpc.admin.stats.queryOptions())
}
