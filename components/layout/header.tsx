"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      clearUser();
      setIsLoggingOut(false);
      setIsMenuOpen(false);
      router.push("/login");
      router.refresh();
    }
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          color="secondary"
          appearance="outline"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Kenar çubuğunu daralt veya genişlet"
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Yonetim Paneli
          </p>
          <p className="text-xs text-muted-foreground">
            Kurumsal kontrol merkezi
          </p>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <Button
          type="button"
          color="secondary"
          appearance="ghost"
          className="gap-2"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <UserCircle2 className="size-5" />
          <span className="hidden text-sm sm:inline">
            {user?.Ad ?? "Kullanıcı"}
          </span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              isMenuOpen && "rotate-180",
            )}
          />
        </Button>

        <div
          className={cn(
            "absolute top-[calc(100%+8px)] right-0 w-48 origin-top-right rounded-lg border border-border bg-card p-1 shadow-xl transition-all duration-200",
            isMenuOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-95 opacity-0",
          )}
          role="menu"
        >
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-muted"
            role="menuitem"
          >
            Profil
          </button>
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-muted"
            role="menuitem"
            onClick={() => router.push("/kurumsal")}
          >
            Kurumsal Ayarlar
          </button>
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-muted"
            role="menuitem"
          >
            Hesap Ayarlari
          </button>
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
          </button>
        </div>
      </div>
    </header>
  );
}
