"use client"

import { EntityPagination } from "@/components/entity-components"
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users"
import { useAdminUsersParams } from "@/features/admin/hooks/use-admin-users-params"

export function UsersPagination() {
  const { data, isFetching } = useAdminUsers()
  const [, setParams] = useAdminUsersParams()

  if (!data || data.totalCount === 0) {
    return null
  }

  return (
    <EntityPagination
      page={data.page}
      totalPages={data.totalPages}
      totalCount={data.totalCount}
      disabled={isFetching}
      onPageChange={(page) => setParams({ page })}
    />
  )
}
