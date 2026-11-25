"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { DeleteAccountCard } from "@/features/privacy/components/delete-account-card"
import { SessionsCard } from "@/features/privacy/components/sessions-card"

/**
 * The "Privacy" tab of the settings page: active sessions, data export and
 * account deletion, plus a link to the privacy policy. The export card is a
 * Server Component and is passed in as `children` by the tab content.
 */
export default function PrivacySettings({
  children,
}: {
  /** The data export card (a Server Component). */
  children: React.ReactNode
}) {
  const t = useTranslations("settings.privacy")

  return (
    <div className="space-y-6">
      <SessionsCard />
      {children}
      <DeleteAccountCard />
      <p className="text-body-sm text-muted-foreground">
        <Link href="/privacy" className="underline underline-offset-4">
          {t("policyLink")}
        </Link>
      </p>
    </div>
  )
}
