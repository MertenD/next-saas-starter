import type React from "react"
import AppSidebar from "@/components/app-sidebar"
import EmailVerificationBanner from "@/components/email-verification-banner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type AppShellProps = {
  /** Initial sidebar state, read from the `sidebar_state` cookie by the layout. */
  defaultOpen: boolean
  children: React.ReactNode
}

/**
 * Layout shell for every page under `(dashboard)`: renders the collapsible
 * app sidebar, the email verification banner, and the page content. The
 * collapsed state is owned by `SidebarProvider`, which writes it to the
 * `sidebar_state` cookie; the layout reads that cookie on the server and
 * passes it as `defaultOpen`, so the sidebar renders in the right state from
 * the first paint and survives reloads.
 */
export default function AppShell({ defaultOpen, children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="bg-background overflow-y-auto">
        <EmailVerificationBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
