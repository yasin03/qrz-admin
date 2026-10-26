"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronRight,
  ContactRound,
  FileText,
  FileUser,
  Fingerprint,
  GitMergeConflict,
  HandCoins,
  Loader2,
  LogOut,
  MapPinned,
  Parasol,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { KULLANICI_TIPI, type KullaniciTipi } from "@/lib/roles";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof Users;
  /** Bu menüyü görebilecek kullanıcı tipleri. */
  roles: KullaniciTipi[];
  /**
   * Verilirse öğe link değil, tıklanınca açılıp kapanan bir grup olur;
   * alt öğeler altında listelenir.
   */
  children?: SubMenuItem[];
};

type SubMenuItem = {
  href: string;
  label: string;
  roles: KullaniciTipi[];
};

const { ADMIN, YONETICI, PERSONEL } = KULLANICI_TIPI;
const TUMU: KullaniciTipi[] = [ADMIN, YONETICI, PERSONEL];

const MENU_ITEMS: MenuItem[] = [
  {
    href: "/personel",
    label: "Personel",
    icon: Users,
    roles: [ADMIN, YONETICI],
  },
  {
    href: "/lokasyon",
    label: "Lokasyon",
    icon: MapPinned,
    roles: [ADMIN, YONETICI],
  },
  { href: "/ozluk", label: "Özlük", icon: FileUser, roles: TUMU },
  { href: "/izin", label: "İzin", icon: Parasol, roles: TUMU },
  { href: "/avans", label: "Avans", icon: HandCoins, roles: TUMU },
  {
    href: "/bordro/parametre",
    label: "Eklenti & Kesinti",
    icon: GitMergeConflict,
    roles: TUMU,
  },
  { href: "/pdks", label: "PDKS", icon: Fingerprint, roles: TUMU },
  { href: "/puantaj", label: "Puantaj", icon: CalendarRange, roles: TUMU },
  { href: "/bordro", label: "Bordro", icon: ContactRound, roles: TUMU },
  { href: "/belgeler", label: "Belgeler", icon: FileText, roles: TUMU },
  {
    href: "/ayarlar",
    label: "Ayarlar",
    icon: Settings,
    roles: [ADMIN, YONETICI],
    children: [
      {
        href: "/ayarlar/tanimlamalar",
        label: "Tanımlamalar",
        roles: [ADMIN, YONETICI],
      },
      {
        href: "/ayarlar/kurumsal",
        label: "Kurumsal Ayarlar",
        roles: [ADMIN, YONETICI],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Optimistic navigation state
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Navigation tamamlanınca (pathname gerçekten değişince) pending'i temizle
  useEffect(() => {
    if (pendingHref && pathname.startsWith(pendingHref)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const userTip = user?.IDKullaniciTip as KullaniciTipi | undefined;
  const menuItems = userTip
    ? MENU_ITEMS.filter((item) => item.roles.includes(userTip)).map((item) => ({
        ...item,
        children: item.children?.filter((child) =>
          child.roles.includes(userTip),
        ),
      }))
    : [];

  // Açık olan alt menüler (href → açık mı). Aktif route bir alt öğedeyse o
  // grup kullanıcı kapatmadıkça açık görünür.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isGroupOpen = (href: string) =>
    openGroups[href] ?? pathname.startsWith(href);
  const toggleGroup = (href: string) =>
    setOpenGroups((prev) => ({ ...prev, [href]: !isGroupOpen(href) }));

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      // Önceki kullanıcının cache'lenmiş verileri (gruplar, şirketler vb.)
      // sonraki girişte görünmesin diye React Query cache'ini boşaltıyoruz.
      queryClient.clear();
      clearUser();
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  const handleNavigate = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMobile(false);

    // senkron state update — event handler body'sinde, startTransition İÇİNDE DEĞİL
    setPendingHref(href);

    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center py-5">
        <Link
          href="/"
          aria-label="Ana sayfa"
          className="relative block h-16 w-full max-w-60 transition-all duration-300 group-data-[collapsible=icon]:max-w-9"
        >
          <Image
            src={isCollapsed ? "/logos/icon-pri.png" : "/logos/logo-pri.png"}
            alt="QRZ"
            fill
            sizes="240px"
            priority
            className={`${isCollapsed ? "" : "p-2"} object-contain dark:hidden`}
          />
          <Image
            src={isCollapsed ? "/logos/icon-sec.png" : "/logos/logo-sec.png"}
            alt="QRZ"
            fill
            sizes="240px"
            priority
            className={`${isCollapsed ? "" : "p-2"} hidden object-contain dark:block`}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-12">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;

                if (item.children?.length) {
                  const firstChild = item.children[0];
                  const isOpen = isGroupOpen(item.href);
                  const isGroupActive = pendingHref
                    ? pendingHref.startsWith(item.href)
                    : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      {isCollapsed ? (
                        // Daraltılmış sidebar'da alt menü görünmediği için
                        // doğrudan ilk alt öğeye gidiyoruz.
                        <SidebarMenuButton
                          asChild
                          isActive={isGroupActive}
                          tooltip={item.label}
                          className="h-10"
                        >
                          <Link
                            href={firstChild.href}
                            onClick={handleNavigate(firstChild.href)}
                          >
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          isActive={isGroupActive && !isOpen}
                          tooltip={item.label}
                          className="h-10"
                          aria-expanded={isOpen}
                          onClick={() => toggleGroup(item.href)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                          <ChevronRight
                            className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                          />
                        </SidebarMenuButton>
                      )}

                      {isOpen && (
                        <SidebarMenuSub>
                          {item.children.map((child) => {
                            const isChildPending = pendingHref === child.href;
                            const isChildActive = pendingHref
                              ? isChildPending
                              : pathname.startsWith(child.href);

                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isChildActive}
                                >
                                  <Link
                                    href={child.href}
                                    onClick={handleNavigate(child.href)}
                                  >
                                    {isChildPending && (
                                      <Loader2 className="animate-spin" />
                                    )}
                                    <span>{child.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                const isTargetPending = pendingHref === item.href;
                const isActive = pendingHref
                  ? isTargetPending
                  : pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-10"
                    >
                      <Link
                        href={item.href}
                        onClick={handleNavigate(item.href)}
                      >
                        {isTargetPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Icon />
                        )}
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
