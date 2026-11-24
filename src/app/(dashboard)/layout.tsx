import { cookies } from "next/headers"
import { getLocale } from "next-intl/server"
import type React from "react"
import AppShell from "@/components/app-shell"
import { DashboardProvider } from "@/components/dashboard-context"
import { LocaleSync } from "@/components/locale-sync"
import { requireAuth } from "@/lib/auth-utils"
import { isPolarEnabled } from "@/lib/polar"
import { HydrateClient } from "@/trpc/server"

/** Cookie written by `SidebarProvider` (`src/components/ui/sidebar.tsx`) with the open/closed state. */
const SIDEBAR_COOKIE_NAME = "sidebar_state"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, activeLocale, cookieStore] = await Promise.all([
    requireAuth(),
    getLocale(),
    cookies(),
  ])
  const { user } = session
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

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
            role: user.role ?? "user",
          },
          polarEnabled: isPolarEnabled,
        }}
      >
        <LocaleSync userLocale={user.locale} activeLocale={activeLocale} />
        <AppShell defaultOpen={defaultOpen}>{children}</AppShell>
      </DashboardProvider>
    </HydrateClient>
  )
}
