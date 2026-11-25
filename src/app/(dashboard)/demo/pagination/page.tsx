import { getTranslations } from "next-intl/server"
import type { SearchParams } from "nuqs/server"
import { EntityContainer, EntityHeader } from "@/components/entity-components"
import { CustomersContainer } from "@/features/demo/pagination/components/customers-container"
import { customersParamsLoader } from "@/features/demo/pagination/server/params-loader"
import { prefetchCustomers } from "@/features/demo/pagination/server/prefetch"
import { requireAuth } from "@/lib/auth-utils"
import { navTitle } from "@/lib/page-metadata"
import { HydrateClient } from "@/trpc/server"

type PaginationDemoPageProps = {
  searchParams: Promise<SearchParams>
}

/**
 * Parses the URL state on the server and prefetches (and awaits) the first
 * query, so the table is already in the HTML on load (or when sharing a
 * filtered link). `loading.tsx` shows the skeleton while this resolves.
 */
export default async function PaginationDemoPage({
  searchParams,
}: PaginationDemoPageProps) {
  await requireAuth()
  const params = await customersParamsLoader(searchParams)
  // Awaited on purpose: with `useQuery` the server HTML must already contain
  // the data. A pending (not awaited) prefetch renders the skeleton on the
  // server while the client hydrates with data, which is a hydration mismatch.
  const [t] = await Promise.all([
    getTranslations("pagination"),
    prefetchCustomers(params),
  ])

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

export const generateMetadata = () => navTitle("pagination")
