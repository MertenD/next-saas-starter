"use client"

import {
  BotIcon,
  CalendarCheckIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  TableIcon,
  ZapIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import UserInfoCard from "@/features/auth/user-info-card"
import { cn } from "@/lib/utils"

type NavItem = {
  /** Key inside the `sidebar` i18n namespace. */
  titleKey: string
  icon: React.ElementType
  url: string
}

const MAIN_ITEMS: NavItem[] = [
  { titleKey: "nav.dashboard", icon: HomeIcon, url: "/dashboard" },
  { titleKey: "nav.settings", icon: SettingsIcon, url: "/settings" },
]

/**
 * One entry per demo feature under `src/features/demo/*`. When adding a new
 * demo feature, add its entry here (and the matching `sidebar.nav.*`
 * translation keys) so it's discoverable.
 */
const DEMO_ITEMS: NavItem[] = [
  { titleKey: "nav.posts", icon: FileTextIcon, url: "/demo/posts" },
  { titleKey: "nav.inngest", icon: ZapIcon, url: "/demo/inngest" },
  { titleKey: "nav.ai", icon: BotIcon, url: "/demo/ai" },
  { titleKey: "nav.pagination", icon: TableIcon, url: "/demo/pagination" },
  { titleKey: "nav.booking", icon: CalendarCheckIcon, url: "/demo/booking" },
]

function NavLink({
  url,
  icon: Icon,
  title,
}: {
  url: string
  icon: React.ElementType
  title: string
}) {
  const pathName = usePathname()
  const isActive =
    url === "/dashboard" ? pathName === "/dashboard" : pathName.startsWith(url)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={title}
        className={cn(
          "text-muted-foreground hover:bg-accent hover:text-foreground",
          "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground",
        )}
      >
        <Link href={url}>
          <Icon />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * Main dashboard navigation sidebar. Nav items are split into core app
 * links (`MAIN_ITEMS`) and a "demo" section (`DEMO_ITEMS`).
 */
export default function AppSidebar() {
  const t = useTranslations("sidebar")
  const tBrand = useTranslations("auth.layout")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="bg-card">
        <SidebarMenuItem className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <SidebarMenuButton
            asChild
            className="h-10 gap-x-4 px-4 group-data-[collapsible=icon]:hidden"
          >
            <Link href="/dashboard">
              <span className="font-semibold text-sm">{tBrand("brand")}</span>
            </Link>
          </SidebarMenuButton>
          <SidebarTrigger />
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent className="bg-card p-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_ITEMS.map(({ titleKey, ...item }) => (
                <NavLink key={item.url} title={t(titleKey)} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-muted-foreground/60 text-xs uppercase tracking-wider">
            {t("demoSection")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DEMO_ITEMS.map(({ titleKey, ...item }) => (
                <NavLink key={item.url} title={t(titleKey)} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-card p-4 group-data-[collapsible=icon]:hidden">
        <UserInfoCard />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
