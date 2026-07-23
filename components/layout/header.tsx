"use client";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderCompany from "./header-company";
import ProfileMenu from "./profile-menu";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
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
        <HeaderCompany />
      </div>

      <ProfileMenu />
    </header>
  );
}
