"use client";

import { useState } from "react";

import type { DbId } from "@/modules/crm/types/satis";

import { SatisDrawer } from "./SatisDrawer";
import { SatisFormDialog, type SatisFormModu } from "./SatisFormDialog";
import { SatisIslemDialog, type SatisIslem } from "./SatisIslemDialog";

type Props = {
  /** Verilince drawer açılır. */
  IDCrmSatis: DbId | null;
  /** Kapanınca null; önceki / sonraki döneme ya da yenilemeyle açılan satışa geçişte yeni ID. */
  onSec: (IDCrmSatis: DbId | null) => void;
};

/**
 * Satış drawer'ı + düzenleme ve işlem (iptal / yenile / sil) pencereleri.
 * Satışlar listesi dışındaki ekranlarda (Finans) satışı sekme değiştirmeden
 * yerinde açmak için.
 */
export function SatisDetay({ IDCrmSatis, onSec }: Props) {
  const [formMod, setFormMod] = useState<SatisFormModu | null>(null);
  const [islem, setIslem] = useState<SatisIslem | null>(null);

  return (
    <>
      <SatisDrawer
        IDCrmSatis={IDCrmSatis}
        onOpenChange={(v) => !v && onSec(null)}
        onDuzenle={(s) => setFormMod({ tip: "duzenle", IDCrmSatis: s.IDCrmSatis })}
        onIslem={(tip, s, tahsilEdilen) => setIslem({ tip, satis: s, tahsilEdilen })}
        onSec={onSec}
      />

      <SatisFormDialog
        open={!!formMod}
        onOpenChange={(v) => !v && setFormMod(null)}
        mod={formMod}
        onKaydedildi={(id) => onSec(id)}
      />

      <SatisIslemDialog
        islem={islem}
        onOpenChange={(v) => !v && setIslem(null)}
        onTamamlandi={(tip, yeniID) => {
          // Yenilemede yeni dönem açılır; silinen satışın drawer'ı kapanır.
          if (tip === "yenile" && yeniID != null) onSec(yeniID);
          if (tip === "sil") onSec(null);
        }}
      />
    </>
  );
}
