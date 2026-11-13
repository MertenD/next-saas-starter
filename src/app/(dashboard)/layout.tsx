import { getLocale } from "next-intl/server"
import type React from "react"
import AppShell from "@/components/app-shell"
import { LocaleSync } from "@/components/locale-sync"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, activeLocale] = await Promise.all([
    requireAuth(),
    getLocale(),
  ])

  return (
    <HydrateClient>
      <LocaleSync
        userLocale={session.user.locale}
        activeLocale={activeLocale}
      />
      <AppShell username={session.user.name.split("@")[0]}>{children}</AppShell>
    </HydrateClient>
  )
}
