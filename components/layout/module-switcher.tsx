"use client";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveModule } from "@/hooks/use-active-module";
import { MODULES, MODULE_SWITCHER_ROLES } from "@/modules/registry";
import { useAuthStore } from "@/stores/auth-store";
import type { KullaniciTipi } from "@/lib/roles";

export function ModuleSwitcher() {
  const { activeModule, selectModule } = useActiveModule();
  const userTip = useAuthStore((state) => state.user?.IDKullaniciTip) as
    | KullaniciTipi
    | undefined;

  if (!userTip || !MODULE_SWITCHER_ROLES.includes(userTip)) return null;

  const modules = MODULES.filter((m) => m.roles.includes(userTip));

  const ActiveIcon = activeModule.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="primary" appearance="outline" className="gap-2 md:w-32">
          <ActiveIcon className="size-5" />
          <span className="hidden flex-1 truncate text-left md:inline">
            {activeModule.shortLabel}
          </span>
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Modüller</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = m.id === activeModule.id;

          return (
            <DropdownMenuItem key={m.id} onClick={() => selectModule(m.id)}>
              <Icon />
              {m.label}
              {isActive && <Check className="ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
