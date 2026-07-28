"use client";

import { usePathname } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";

// Shell göstermek istemediğin (login, şifremi unuttum vb.) sayfaların yollarını buraya ekle
// app-shell.tsx
type AppShellProps = {
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
};

const PUBLIC_PATHS = ["/login", "/forgot-password"];

export function AppShell({ children, defaultSidebarOpen }: AppShellProps) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

  if (isPublicPage) return <>{children}</>;

  return (
    <DashboardShell defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </DashboardShell>
  );
}
