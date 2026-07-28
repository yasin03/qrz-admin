"use client";

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AppSidebar } from "./app-sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
};

export function DashboardShell({
  children,
  defaultSidebarOpen = true,
}: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <DashboardShellInner>{children}</DashboardShellInner>
    </SidebarProvider>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="relative flex min-h-screen w-full bg-[radial-gradient(circle_at_top_right,oklch(0.985_0.01_230),transparent_40%),radial-gradient(circle_at_bottom_left,oklch(0.97_0.015_250),transparent_45%)]">
      <AppSidebar />

      <SidebarInset>
        <Header onToggleSidebar={toggleSidebar} />

        <main className="flex-1 p-4 lg:p-6">
          <section className="h-full min-h-[400px] rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300">
            {children}
          </section>
        </main>

        <Footer />
      </SidebarInset>
    </div>
  );
}