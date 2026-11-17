import { getTranslations } from "next-intl/server"
import SettingsTabs from "@/features/settings/components/settings-tabs"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

export default async function SettingsPage() {
  const t = await getTranslations("settings")
  // Awaited on purpose: with `useQuery` the server HTML must already contain the
  // data. A pending (not awaited) prefetch renders the skeleton on the server
  // while the client hydrates with data, which is a hydration mismatch.
  await prefetch(trpc.user.me.queryOptions())

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
