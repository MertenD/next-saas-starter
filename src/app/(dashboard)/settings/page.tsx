import { getTranslations } from "next-intl/server"
import { DataExportCard } from "@/features/privacy/components/data-export-card"
import SettingsTabs from "@/features/settings/components/settings-tabs"
import { requireAuth } from "@/lib/auth-utils"
import { navTitle } from "@/lib/page-metadata"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

export default async function SettingsPage() {
  await requireAuth()
  const t = await getTranslations("settings")
  // Awaited on purpose: with `useQuery` the server HTML must already contain the
  // data. Without it (or with a pending prefetch) the server renders the
  // skeleton while the client may already have data, e.g. from the persisted
  // query cache, which is a hydration mismatch. Every `useQuery` that a settings
  // tab renders on load belongs here (the tab comes from the URL, so any tab can
  // be the server-rendered one).
  await Promise.all([
    prefetch(trpc.user.me.queryOptions()),
    prefetch(trpc.privacy.sessions.queryOptions()),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <div className="max-w-2xl">
        <HydrateClient>
          <SettingsTabs exportCard={<DataExportCard />} />
        </HydrateClient>
      </div>
    </div>
  )
}

export const generateMetadata = () => navTitle("settings")
