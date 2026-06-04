"use client";

import React, { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { useAuthStore } from "@/store/authStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const { config } = useSidebarConfig();
  const { fetchUser, user } = useAuthStore();

  // Fetch user data on mount if not already loaded
  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [fetchUser, user]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={`h-svh overflow-hidden ${config.collapsible === "none" ? "sidebar-none-mode" : ""}`}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset className="h-svh overflow-hidden flex flex-col">
            <SiteHeader onSettingsClick={() => setThemeCustomizerOpen(true)} />
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <div className="@container/main flex flex-1 flex-col min-h-0">
                <div className="flex flex-col flex-1 min-h-0">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset className="h-svh overflow-hidden flex flex-col">
            <SiteHeader onSettingsClick={() => setThemeCustomizerOpen(true)} />
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <div className="@container/main flex flex-1 flex-col min-h-0">
                <div className="flex flex-col flex-1 min-h-0">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
    </SidebarProvider>
  );
}
