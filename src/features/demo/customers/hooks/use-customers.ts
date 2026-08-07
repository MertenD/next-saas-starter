"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useCustomersParams } from "@/features/demo/customers/hooks/use-customers-params"
import { useTRPC } from "@/trpc/client"

export const useCustomers = () => {
  const trpc = useTRPC()
  const [params] = useCustomersParams()

  return useQuery({
    ...trpc.customers.getMany.queryOptions(params),
    placeholderData: keepPreviousData,
  })
}
