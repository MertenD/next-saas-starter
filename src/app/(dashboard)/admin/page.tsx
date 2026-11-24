import { getTranslations } from "next-intl/server"
import { EntityContainer, EntityHeader } from "@/components/entity-components"
import { AdminStats } from "@/features/admin/components/admin-stats"
import { prefetchAdminStats } from "@/features/admin/server/prefetch"
import { requireAdmin } from "@/lib/auth-utils"
import { navTitle } from "@/lib/page-metadata"
import { HydrateClient } from "@/trpc/server"

/**
 * Admin overview. `requireAdmin()` redirects everyone else; the data behind it
 * is protected separately by `adminProcedure`. The prefetch is awaited so the
 * numbers are in the server HTML (see the hydration note in `AGENTS.md`).
 */
export default async function AdminPage() {
  await requireAdmin()
  const [t] = await Promise.all([
    getTranslations("admin.overview"),
    prefetchAdminStats(),
  ])

  return (
    <HydrateClient>
      <EntityContainer
        header={
          <EntityHeader title={t("title")} description={t("description")} />
        }
      >
        <AdminStats />
      </EntityContainer>
    </HydrateClient>
  )
}

export const generateMetadata = () => navTitle("adminOverview")
