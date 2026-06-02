"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Settings,
  Bot,
  History,
  CalendarClock,
  Home,
  Send,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@trading.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Features",
      items: [
        {
          title: "Home",
          url: "/home",
          icon: Home,
        },
        {
          title: "Agents",
          url: "/research",
          icon: Bot,
        },
        {
          title: "Report History",
          url: "/reports",
          icon: History,
        },
        {
          title: "Scheduled Jobs",
          url: "/jobs",
          icon: CalendarClock,
        },
        {
          title: "Analyst System",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Deliveries",
          url: "/deliveries",
          icon: Send,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
}

import { useLanguage } from "@/contexts/language-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useLanguage()

  const translatedNavGroups = React.useMemo(() => {
    return data.navGroups.map((group) => {
      const groupKey = `sidebar.${group.label.toLowerCase()}` as any
      return {
        label: t(groupKey) || group.label,
        items: group.items.map((item) => {
          const itemKey = `sidebar.${item.title.toLowerCase().replace(" ", "")}` as any
          return {
            ...item,
            title: t(itemKey) || item.title,
          }
        }),
      }
    })
  }, [t])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t("sidebar.title")}</span>
                  <span className="truncate text-xs">{t("sidebar.subtitle")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {translatedNavGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
