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
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Başlığın yanında gösterilir (örn. durum rozeti). */
  badge?: ReactNode;
  description?: ReactNode;
  /** Başlığın solunda gösterilir (örn. renkli ikon kutusu). */
  icon?: ReactNode;
  /** Header alanına ek sınıf (örn. gradient arka plan). */
  headerClassName?: string;
  footer?: ReactNode;
  bodyClassName?: string;
  /** md: 28rem (varsayılan), lg: 40rem — mobilde her ikisi de tam genişlik */
  size?: "md" | "lg";
  children: ReactNode;
};

const SIZE_CLASS = {
  md: "data-[swipe-axis=x]:sm:[--drawer-content-width:28rem]",
  lg: "data-[swipe-axis=x]:sm:[--drawer-content-width:40rem]",
} as const;

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
  icon,
  headerClassName,
  footer,
  bodyClassName,
  size = "md",
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
      <DrawerContent
        className={cn(
          "rounded-xl border shadow-lg after:hidden [--drawer-inset:1rem] data-[swipe-axis=x]:[--drawer-content-width:calc(100%-2rem)]",
          SIZE_CLASS[size],
        )}
      >
        <DrawerHeader
          className={cn("relative border-b pr-12 pb-4", headerClassName)}
        >
          <div className="flex items-center gap-3">
            {icon}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DrawerTitle className="truncate text-lg">{title}</DrawerTitle>
                {badge}
              </div>
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </div>
          </div>
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

        <div
          className={cn("min-h-0 flex-1 overflow-y-auto p-4", bodyClassName)}
        >
          {children}
        </div>

        {footer && (
          <DrawerFooter className="flex-row border-t pt-4">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
