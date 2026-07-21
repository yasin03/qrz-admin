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
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-72 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-center px-2 ">
          <div className="relative h-20 w-full max-w-[180px]">
            <Image
              src="/logos/logo-big.png"
              alt="QRZ"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex-1  mt-5">
          <SidebarMenu onNavigate={onClose} />
        </div>

        <div className="pt-4 mb-18">
          <Button
            type="button"
            color="danger"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="size-4" />
            {isLoggingOut ? "Cikis Yapiliyor..." : "Çıkış Yap"}
          </Button>
        </div>
      </aside>
    </>
  );
}
