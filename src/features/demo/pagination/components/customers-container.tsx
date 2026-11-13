"use client"

import { CustomersPagination } from "@/features/demo/pagination/components/customers-pagination"
import { CustomersTable } from "@/features/demo/pagination/components/customers-table"
import { CustomersToolbar } from "@/features/demo/pagination/components/customers-toolbar"

export function CustomersContainer() {
  return (
    <div className="space-y-4">
      <CustomersToolbar />
      <CustomersTable />
      <CustomersPagination />
    </div>
  )
}
