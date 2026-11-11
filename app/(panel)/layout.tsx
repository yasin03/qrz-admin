import { cookies } from "next/headers";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ACTIVE_MODULE_COOKIE, isModuleId } from "@/modules/registry";

// (panel) altındaki her sayfa oturum gerektirir ve sidebar/header'lı shell
// içinde render edilir. Login, yasal vb. sayfalar bu grubun dışında.
export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";
  const lastModule = cookieStore.get(ACTIVE_MODULE_COOKIE)?.value;

  return (
    <DashboardShell
      defaultSidebarOpen={defaultSidebarOpen}
      lastModule={isModuleId(lastModule) ? lastModule : undefined}
    >
      {children}
    </DashboardShell>
  );
}
