import { getTranslations } from "next-intl/server"
import type { SearchParams } from "nuqs/server"
import { EntityContainer, EntityHeader } from "@/components/entity-components"
import { CustomersContainer } from "@/features/demo/pagination/components/customers-container"
import { customersParamsLoader } from "@/features/demo/pagination/server/params-loader"
import { prefetchCustomers } from "@/features/demo/pagination/server/prefetch"
import { HydrateClient } from "@/trpc/server"

type PaginationDemoPageProps = {
  searchParams: Promise<SearchParams>
}

/**
 * Parses the URL state on the server and prefetches the first query, so the
 * table is already in the HTML on load (or when sharing a filtered link).
 */
export default async function PaginationDemoPage({
  searchParams,
}: PaginationDemoPageProps) {
  const t = await getTranslations("pagination")
  const params = await customersParamsLoader(searchParams)
  prefetchCustomers(params)

  return (
    <HydrateClient>
      <EntityContainer
        header={
          <EntityHeader title={t("title")} description={t("description")} />
        }
      >
        <CustomersContainer />
      </EntityContainer>
    </HydrateClient>
  )
}
