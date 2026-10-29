"use client";

import { Loader2, ShieldOff } from "lucide-react";

import { usePersonelYetki } from "@/hooks/use-per-yetki";
import type { PerYetkiKey } from "@/lib/per-yetki";

type PersonelYetkiGuardProps = {
  yetki: PerYetkiKey;
  children: React.ReactNode;
};

// Personel, admin'in kapattığı bir sayfaya adres çubuğundan girerse içeriği
// göstermez. Asıl koruma API tarafında (lib/per-yetki-server.js).
export function PersonelYetkiGuard({
  yetki,
  children,
}: PersonelYetkiGuardProps) {
  const { can, isLoading } = usePersonelYetki();

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!can(yetki)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <ShieldOff className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground">
          Bu sayfayı görüntüleme yetkiniz bulunmuyor.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
