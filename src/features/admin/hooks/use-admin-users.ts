"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useAdminUsersParams } from "@/features/admin/hooks/use-admin-users-params"
import { useTRPC } from "@/trpc/client"

/** The admin users list for the current URL state (page, search). */
export const useAdminUsers = () => {
  const trpc = useTRPC()
  const [params] = useAdminUsersParams()

  return useQuery({
    ...trpc.admin.users.queryOptions(params),
    placeholderData: keepPreviousData,
  })
}
