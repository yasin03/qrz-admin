"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches
    ) {
      return;
    }

    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    if (!isSidebarOpen || isDesktop) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [isSidebarOpen]);

  return (
    <div className="relative flex min-h-screen bg-[radial-gradient(circle_at_top_right,oklch(0.985_0.01_230),transparent_40%),radial-gradient(circle_at_bottom_left,oklch(0.97_0.015_250),transparent_45%)]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
        <Header onToggleSidebar={handleToggleSidebar} />

        <main className="flex-1 p-4 lg:p-6">
          <section className="h-full min-h-[400px] rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300">
            {children}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
