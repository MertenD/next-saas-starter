"use client"

import { UsersPagination } from "@/features/admin/components/users-pagination"
import { UsersTable } from "@/features/admin/components/users-table"
import { UsersToolbar } from "@/features/admin/components/users-toolbar"

export function UsersContainer() {
  return (
    <div className="space-y-4">
      <UsersToolbar />
      <UsersTable />
      <UsersPagination />
    </div>
  )
}
