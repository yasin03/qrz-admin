"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Fingerprint,
  HandCoins,
  LogOut,
  MapPinned,
  Parasol,
  QrCode,
  ScanBarcode,
  Users,
} from "lucide-react";
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
import { useAuthStore } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof Users;
};

const adminMenuItems: MenuItem[] = [
  { href: "/personel", label: "Personel", icon: Users },
  { href: "/lokasyon", label: "Lokasyon", icon: MapPinned },
  { href: "/pdks", label: "PDKS", icon: Fingerprint },
];

const yoneticiMenuItems: MenuItem[] = [
  { href: "/personel", label: "Personel", icon: Users },
  { href: "/izin", label: "İzin", icon: Parasol },
  { href: "/avans", label: "Avans", icon: HandCoins },
  { href: "/pdks", label: "PDKS", icon: Fingerprint },
  { href: "/barkod", label: "Barkod", icon: QrCode },
];

const personelMenuItems: MenuItem[] = [
  { href: "/izin", label: "İzin", icon: Parasol },
  { href: "/avans", label: "Avans", icon: HandCoins },
  { href: "/pdks", label: "PDKS", icon: Fingerprint },
  { href: "/barkod", label: "Barkod", icon: ScanBarcode },
];

/** IDKullaniciTip -> gösterilecek menü. Yeni bir rol eklenirse sadece buraya satır eklenir. */
const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  [KULLANICI_TIPI.ADMIN]: adminMenuItems,
  [KULLANICI_TIPI.YONETICI]: yoneticiMenuItems,
  [KULLANICI_TIPI.PERSONEL]: personelMenuItems,
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const user = useAuthStore((state) => state.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = user ? (MENU_BY_ROLE[user.IDKullaniciTip] ?? []) : [];

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
