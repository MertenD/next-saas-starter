import { getTranslations } from "next-intl/server"
import type { SearchParams } from "nuqs/server"
import { EntityContainer, EntityHeader } from "@/components/entity-components"
import { UsersContainer } from "@/features/admin/components/users-container"
import { adminUsersParamsLoader } from "@/features/admin/server/params-loader"
import { prefetchAdminUsers } from "@/features/admin/server/prefetch"
import { requireAdmin } from "@/lib/auth-utils"
import { navTitle } from "@/lib/page-metadata"
import { HydrateClient } from "@/trpc/server"

type AdminUsersPageProps = {
  searchParams: Promise<SearchParams>
}

/**
 * Admin user management. Same URL-state + prefetch pattern as the pagination
 * demo; `requireAdmin()` keeps everyone else out of the page.
 */
export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  await requireAdmin()
  const params = await adminUsersParamsLoader(searchParams)
  const [t] = await Promise.all([
    getTranslations("admin.users"),
    prefetchAdminUsers(params),
  ])

  return (
    <HydrateClient>
      <EntityContainer
        header={
          <EntityHeader title={t("title")} description={t("description")} />
        }
      >
        <UsersContainer />
      </EntityContainer>
    </HydrateClient>
  )
}

export const generateMetadata = () => navTitle("adminUsers")
