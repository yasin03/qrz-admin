"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fingerprint, LogOut, MapPinned, Users } from "lucide-react";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/services/auth";

const menuItems = [
  { href: "/personel", label: "Personel", icon: Users },
  { href: "/lokasyonlar", label: "Lokasyonlar", icon: MapPinned },
  { href: "/pdks", label: "PDKS", icon: Fingerprint },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    // collapsible="icon" -> masaüstünde daraltılınca sadece ikonlar kalır
    // (senin eski isCollapsed davranışının karşılığı), mobilde otomatik
    // Sheet/drawer'a döner — ayrıca hiçbir şey yazmana gerek yok.
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center py-5">
        <div className="relative h-16 w-full max-w-[240px] transition-all duration-300 group-data-[collapsible=icon]:max-w-9">
          <Image
            src={isCollapsed ? "/logos/logo-icon.png" : "/logos/logo-big.png"}
            alt="QRZ"
            fill
            sizes="240px"
            priority
            className="object-contain"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-12">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => setOpenMobile(false)}
                      className="h-10"
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-12">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={isLoggingOut}
              tooltip="Çıkış Yap"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span>{isLoggingOut ? "Çıkış Yapılıyor..." : "Çıkış Yap"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}