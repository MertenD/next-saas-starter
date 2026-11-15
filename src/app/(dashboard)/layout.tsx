import { getLocale } from "next-intl/server"
import type React from "react"
import AppShell from "@/components/app-shell"
import { DashboardProvider } from "@/components/dashboard-context"
import { LocaleSync } from "@/components/locale-sync"
import { requireAuth } from "@/lib/auth-utils"
import { isPolarEnabled } from "@/lib/polar"
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
  const { user } = session

  return (
    <HydrateClient>
      <DashboardProvider
        value={{
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image ?? null,
            emailVerified: user.emailVerified,
          },
          polarEnabled: isPolarEnabled,
        }}
      >
        <LocaleSync userLocale={user.locale} activeLocale={activeLocale} />
        <AppShell>{children}</AppShell>
      </DashboardProvider>
    </HydrateClient>
  )
}
