"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Loader2, LogOut } from "lucide-react";
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
import { logout } from "@/modules/core/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { KullaniciTipi } from "@/lib/roles";
import type { MenuItem } from "@/types/navigation";
import { usePersonelYetki } from "@/modules/core/hooks/use-per-yetki";
import { useActiveModule } from "@/hooks/use-active-module";

// Aktif menü öğesi: satırın tamamı lacivertten maviye gradyanlı dolu "pill",
// açık renk yazı/ikon ve nötr gri gölge. Hover nötr gri — aktif öğeyle
// karışmasın. Gradyan lacivertten logodaki açık maviye gidiyor (açık mavi %70,
// lacivert %30 karışım — "_70%" değeri ne kadar açık olacağını belirliyor);
// yazı solda, lacivert tarafta kaldığı için okunur. Dark modda
// sidebar-primary zaten cyan olduğu için düz cyan pill + koyu yazı.
// İkonlar satır yüksekliğinde (44px) bir kutunun ortasında, büyük görünsün.
// (data-active: varyantı data-active="false"ı hariç tutuyor, globals.css.)
const MENU_BUTTON_CLASS = [
  // Daraltılmış sidebar'da da aynı ölçü (44px); sidebar'ın ikon genişliği buna
  // göre dashboard-shell'de 3.75rem'e çekildi.
  "h-11 gap-3 rounded-xl p-0 pr-2 transition-[width,height,padding,background-color,color,box-shadow] duration-200 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!",
  "[&>svg:first-child]:size-11 [&>svg:first-child]:p-3",
  "hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground active:bg-sidebar-foreground/10 active:text-sidebar-foreground",
  "data-active:bg-linear-to-r data-active:from-sidebar-primary data-active:to-[color-mix(in_oklab,var(--sidebar-primary),var(--sidebar-ring)_70%)]",
  "data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:shadow-md data-active:shadow-black/20 dark:data-active:shadow-black/40",
  "data-active:hover:text-sidebar-primary-foreground data-active:hover:brightness-110",
].join(" ");

const MENU_SUB_BUTTON_CLASS = [
  "transition-colors",
  "hover:bg-sidebar-foreground/6 hover:text-sidebar-foreground active:bg-sidebar-foreground/10 active:text-sidebar-foreground",
  "data-active:bg-sidebar-ring/15 data-active:font-semibold data-active:text-sidebar-primary [&>svg]:text-current",
].join(" ");

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

  const { activeModule } = useActiveModule();

  const userTip = user?.IDKullaniciTip as KullaniciTipi | undefined;
  const { can, isLoading: isLoadingYetki } = usePersonelYetki();
  // Yetkiler yüklenirken yetkiye bağlı menüleri gizli tut; yasak menü
  // önce görünüp sonra kaybolmasın.
  const hasYetki = (item: MenuItem) =>
    !item.yetki || (!isLoadingYetki && can(item.yetki));
  const menuItems = userTip
    ? activeModule.nav
        .filter((item) => item.roles.includes(userTip) && hasYetki(item))
        .map((item) => ({
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
          href={activeModule.homeHref}
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
            <SidebarMenu className="gap-1">
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
                          className={MENU_BUTTON_CLASS}
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
                          className={MENU_BUTTON_CLASS}
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
                                  className={MENU_SUB_BUTTON_CLASS}
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
                  : pathname === item.href ||
                    (!!item.matchNested &&
                      pathname.startsWith(`${item.href}/`));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={MENU_BUTTON_CLASS}
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
              className="h-11 gap-3 rounded-xl p-0 pr-2 text-destructive hover:bg-destructive/10 hover:text-destructive [&>svg:first-child]:size-11 [&>svg:first-child]:p-3 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
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
