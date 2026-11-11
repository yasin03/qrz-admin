"use client";

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AppSidebar } from "./app-sidebar";
import { ActiveModuleProvider } from "@/hooks/use-active-module";
import type { ModuleId } from "@/modules/registry";

type DashboardShellProps = {
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
  lastModule?: ModuleId;
};

export function DashboardShell({
  children,
  defaultSidebarOpen = true,
  lastModule,
}: DashboardShellProps) {
  return (
    <ActiveModuleProvider lastModule={lastModule}>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <DashboardShellInner>{children}</DashboardShellInner>
      </SidebarProvider>
    </ActiveModuleProvider>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();

  return (
    // Shell ekran yüksekliğine sabit: header ve footer yerinde kalır,
    // yalnızca <main> kendi içinde kayar.
    <div className="relative flex h-svh w-full overflow-hidden bg-[radial-gradient(circle_at_top_right,oklch(0.985_0.01_230),transparent_40%),radial-gradient(circle_at_bottom_left,oklch(0.97_0.015_250),transparent_45%)]">
      <AppSidebar />

      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <section className="min-h-full rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300">
            {children}
          </section>
        </main>

        <Footer />
      </SidebarInset>
    </div>
  );
}