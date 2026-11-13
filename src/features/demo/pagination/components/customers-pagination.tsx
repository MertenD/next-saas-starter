"use client"

import { EntityPagination } from "@/components/entity-components"
import { useCustomers } from "@/features/demo/pagination/hooks/use-customers"
import { useCustomersParams } from "@/features/demo/pagination/hooks/use-customers-params"

export function CustomersPagination() {
  const { data, isFetching } = useCustomers()
  const [, setParams] = useCustomersParams()

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
