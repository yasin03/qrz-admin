"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarMenu } from "@/components/layout/sidebar-menu";
import { logout } from "@/services/auth";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
};

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
}: SidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      onClose();
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-72 flex-col overflow-hidden border-r border-sidebar-border bg-neutral-100 px-4 py-5 shadow-2xl transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-18 lg:px-2" : "lg:w-72",
        )}
      >
        <div
          className={cn(
            "mb-8 flex items-center justify-center px-2",
            isCollapsed && "lg:px-0",
          )}
        >
          <div
            className={cn(
              "relative h-20 w-full max-w-[180px] transition-all duration-300",
              isCollapsed && "lg:h-9 lg:max-w-9",
            )}
          >
            <Image
              src={isCollapsed ? "/logos/logo-icon.png" : "/logos/logo-big.png"}
              alt="QRZ"
              fill
              sizes="100vw"
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-x-hidden">
          <SidebarMenu onNavigate={onClose} isCollapsed={isCollapsed} />
        </div>

        <div className="mb-18 pt-4">
          <Button
            type="button"
            color="danger"
            className={cn(
              "w-full h-10",
              isCollapsed ? "lg:justify-center lg:px-0" : "justify-start",
            )}
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? "Çıkış Yap" : undefined}
          >
            <LogOut className="size-4 shrink-0" />
            <span className={cn(isCollapsed && "lg:hidden")}>
              {isLoggingOut ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
}
