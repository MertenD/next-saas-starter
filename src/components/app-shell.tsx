"use client";

import type React from "react";
import AppSidebar from "@/components/app-sidebar";
import EmailVerificationBanner from "@/components/email-verification-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUIStore } from "@/stores/ui-store";

type AppShellProps = {
  username: string;
  children: React.ReactNode;
};

/**
 * Layout shell for every page under `(dashboard)`: renders the collapsible
 * app sidebar, the email verification banner, and the page content. Sidebar
 * collapsed state is lifted to `useUIStore` (rather than local state) so it
 * can be read/toggled from both this component and the sidebar itself.
 */
export default function AppShell({ username, children }: AppShellProps) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  return (
    <SidebarProvider
      open={!sidebarCollapsed}
      onOpenChange={(open) => setSidebarCollapsed(!open)}
    >
      <AppSidebar username={username} />
      <SidebarInset className="bg-background overflow-y-auto">
        <EmailVerificationBanner />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
