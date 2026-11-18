import { getTranslations } from "next-intl/server"
import type React from "react"
import AppSidebar from "@/components/app-sidebar"
import EmailVerificationBanner from "@/components/email-verification-banner"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type AppShellProps = {
  /** Initial sidebar state, read from the `sidebar_state` cookie by the layout. */
  defaultOpen: boolean
  children: React.ReactNode
}

/**
 * Layout shell for every page under `(dashboard)`: renders the collapsible
 * app sidebar, a mobile-only top bar with the menu button (below `md` the
 * sidebar is an off-canvas sheet, so its own trigger is unreachable), the email verification banner, and the page content. The
 * collapsed state is owned by `SidebarProvider`, which writes it to the
 * `sidebar_state` cookie; the layout reads that cookie on the server and
 * passes it as `defaultOpen`, so the sidebar renders in the right state from
 * the first paint and survives reloads.
 */
export default async function AppShell({
  defaultOpen,
  children,
}: AppShellProps) {
  const tBrand = await getTranslations("auth.layout")

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="bg-background overflow-y-auto">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="size-10" />
          <span className="font-semibold text-sm">{tBrand("brand")}</span>
        </header>
        <EmailVerificationBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
