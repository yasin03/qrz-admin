"use client";
import { useState, type ReactNode } from "react";
import { XIcon } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Başlığın yanında gösterilir (örn. durum rozeti). */
  badge?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * Seçili kayıt null'a düştüğünde son değeri döndürür; drawer kapanırken
 * içerik animasyon bitene kadar boşalmaz.
 */
export function useLastDefined<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}

/** Sağdan açılan, kenarlardan boşluklu detay drawer'ı. */
export function SideDrawer({
  open,
  onOpenChange,
  title,
  badge,
  description,
  footer,
  bodyClassName,
  children,
}: Props) {
  return (
    <Drawer
      open={open}
      swipeDirection="right"
      onOpenChange={(next, details) => {
        // Radix portal'larına (dropdown, select, onay dialog'u) yapılan
        // tıklamalar Base UI için "dışarı tıklama" sayılıyor; drawer'ı
        // yalnızca kendi arka planına tıklanınca kapat.
        const target = details.event?.target as Element | null;
        if (
          details.reason === "outside-press" &&
          !target?.closest(
            '[data-slot="drawer-viewport"], [data-slot="drawer-overlay"]',
          )
        ) {
          details.cancel();
          return;
        }
        onOpenChange(next);
      }}
    >
      <DrawerContent className="rounded-xl border shadow-lg after:hidden [--drawer-inset:1rem] data-[swipe-axis=x]:[--drawer-content-width:calc(100%-2rem)] data-[swipe-axis=x]:sm:[--drawer-content-width:28rem]">
        <DrawerHeader className="relative border-b pr-12 pb-4">
          <div className="flex items-center gap-2">
            <DrawerTitle className="truncate text-lg">{title}</DrawerTitle>
            {badge}
          </div>
          {description && <DrawerDescription>{description}</DrawerDescription>}
          <DrawerClose
            render={
              <Button
                appearance="ghost"
                size="icon-sm"
                className="absolute top-3 right-3"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Kapat</span>
          </DrawerClose>
        </DrawerHeader>

        <div className={cn("min-h-0 flex-1 overflow-y-auto p-4", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <DrawerFooter className="flex-row border-t pt-4">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
