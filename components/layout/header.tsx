"use client";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderCompany from "./header-company";
import ProfileMenu from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { useAuthHasHydrated, useHasRole } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          appearance="outline"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Kenar çubuğunu daralt veya genişlet"
        >
          <PanelLeft className="size-5" />
        </Button>
        {!isPersonel && <HeaderCompany />}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
