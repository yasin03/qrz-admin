"use client";

import { usePathname } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";

// Shell göstermek istemediğin (login, şifremi unuttum vb.) sayfaların yollarını buraya ekle
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth"];

type AppShellProps = {
  children: React.ReactNode;
};
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));

  if (isPublicPage) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
