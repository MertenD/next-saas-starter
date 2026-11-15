import { getTranslations } from "next-intl/server"
import SettingsTabs from "@/features/settings/components/settings-tabs"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

export default async function SettingsPage() {
  const t = await getTranslations("settings")
  // Not awaited on purpose: the query streams to the client while the shell renders.
  prefetch(trpc.user.me.queryOptions())

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <div className="max-w-2xl">
        <HydrateClient>
          <SettingsTabs />
        </HydrateClient>
      </div>
    </div>
  )
}
