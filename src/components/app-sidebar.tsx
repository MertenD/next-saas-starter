"use client";

import {
  BotIcon,
  CalendarCheckIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  TableIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
} from "@/components/ui/sidebar";
import UserInfoCard from "@/features/auth/user-info-card";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  username: string;
};

/**
 * Main dashboard navigation sidebar. Nav items are split into core app
 * links and a "demo" section listing every demo feature under
 * `src/features/demo/*` - when adding a new demo feature, add its entry to
 * `demoItems` (and the matching `sidebar.nav.*` translation keys) so it's
 * discoverable.
 */
export default function AppSidebar({ username }: AppSidebarProps) {
  const pathName = usePathname();
  const t = useTranslations("sidebar");
  const tBrand = useTranslations("auth.layout");

  const mainItems = [
    { title: t("nav.dashboard"), icon: HomeIcon, url: "/dashboard" },
    { title: t("nav.settings"), icon: SettingsIcon, url: "/settings" },
  ];

  const demoItems = [
    { title: t("nav.posts"), icon: FileTextIcon, url: "/demo/posts" },
    { title: t("nav.inngest"), icon: ZapIcon, url: "/demo/inngest" },
    { title: t("nav.ai"), icon: BotIcon, url: "/demo/ai" },
    { title: t("nav.customers"), icon: TableIcon, url: "/demo/customers" },
    { title: t("nav.booking"), icon: CalendarCheckIcon, url: "/demo/booking" },
  ];

  const NavLink = ({
    url,
    icon: Icon,
    title,
  }: {
    url: string;
    icon: React.ElementType;
    title: string;
  }) => {
    const isActive =
      url === "/dashboard"
        ? pathName === "/dashboard"
        : pathName.startsWith(url);

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
          <Link prefetch href={url}>
            <Icon />
            <span>{title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="bg-card">
        <SidebarMenuItem className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <SidebarMenuButton
            asChild
            className="h-10 gap-x-4 px-4 group-data-[collapsible=icon]:hidden"
          >
            <Link href="/" prefetch>
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
              {mainItems.map((item) => (
                <NavLink key={item.url} {...item} />
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
              {demoItems.map((item) => (
                <NavLink key={item.url} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-card p-4 group-data-[collapsible=icon]:hidden">
        <UserInfoCard username={username} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
