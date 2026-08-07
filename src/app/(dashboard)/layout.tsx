import type React from "react"
import AppShell from "@/components/app-shell"
import { requireAuth } from "@/lib/auth-utils"
import { HydrateClient } from "@/trpc/server"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <HydrateClient>
      <AppShell username={session.user.name.split("@")[0]}>{children}</AppShell>
    </HydrateClient>
  )
}
