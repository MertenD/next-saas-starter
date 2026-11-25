"use client"

import { useTranslations } from "next-intl"
import { parseAsStringEnum, useQueryState } from "nuqs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PrivacySettings from "@/features/privacy/components/privacy-settings"
import AccountSettings from "@/features/settings/components/account-settings"
import GeneralSettings from "@/features/settings/components/general-settings"
import SubscriptionSettings from "@/features/settings/components/subscription-settings"

const TAB_OPTIONS = ["account", "subscription", "privacy", "general"] as const
type SettingsTab = (typeof TAB_OPTIONS)[number]

type SettingsTabsProps = {
  /** The data export card, a Server Component that the page passes through (client components cannot import it). */
  exportCard: React.ReactNode
}

export default function SettingsTabs({ exportCard }: SettingsTabsProps) {
  const t = useTranslations("settings.tabs")
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum<SettingsTab>([...TAB_OPTIONS])
      .withDefault("account")
      .withOptions({ clearOnDefault: true }),
  )

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as SettingsTab)}>
      <TabsList>
        <TabsTrigger value="account">{t("account")}</TabsTrigger>
        <TabsTrigger value="subscription">{t("subscription")}</TabsTrigger>
        <TabsTrigger value="privacy">{t("privacy")}</TabsTrigger>
        <TabsTrigger value="general">{t("general")}</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <AccountSettings />
      </TabsContent>
      <TabsContent value="subscription">
        <SubscriptionSettings />
      </TabsContent>
      <TabsContent value="privacy">
        <PrivacySettings>{exportCard}</PrivacySettings>
      </TabsContent>
      <TabsContent value="general">
        <GeneralSettings />
      </TabsContent>
    </Tabs>
  )
}
