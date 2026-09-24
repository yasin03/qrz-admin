"use client";
import { CalendarDays, Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderCompany from "./header-company";
import ProfileMenu from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { useAuthHasHydrated, useHasRole } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    new Date(),
  );

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
        <Popover>
          <PopoverTrigger asChild>
            <Button appearance="outline" size="icon">
              <CalendarDays />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-3">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              className="scale-110 p-4"
            />
          </PopoverContent>
        </Popover>
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
