"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCrmSatisDetay } from "@/modules/crm/hooks/use-satis";
import { useBelgePdfKisiEk } from "@/modules/crm/hooks/use-teklif";
import { satisPdfDosyaAdi, satisPdfVerisi } from "@/modules/crm/lib/satis";
import type { CrmSatisDetay, DbId } from "@/modules/crm/types/satis";

import { TeklifPdfOnizleme } from "../teklifler/TeklifPdfOnizleme";

type Props = {
  /** Verilince açılır. */
  IDCrmSatis: DbId | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Satış PDF'inin verisi (kişi kartından adres / vergi no). Drawer (doğrudan
 * indir / yazdır) ve önizleme penceresi ortak kullanır.
 */
export function useSatisPdfVerisi(s: CrmSatisDetay | null | undefined) {
  const kisiEk = useBelgePdfKisiEk(s ? String(s.IDCrmKisi) : null, !!s);
  return useMemo(() => (s ? satisPdfVerisi(s, kisiEk) : null), [s, kisiEk]);
}

/** Kayıtlı satışın PDF önizlemesi (indir / yazdır). */
export function SatisPdfDialog({ IDCrmSatis, onOpenChange }: Props) {
  const { data: s, isLoading, isError } = useCrmSatisDetay(IDCrmSatis);
  const veri = useSatisPdfVerisi(s);

  return (
    <Dialog open={IDCrmSatis != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Satış PDF{s ? ` — ${s.SatisNo}` : ""}</DialogTitle>
          <DialogDescription>{s?.Konu ?? "Satış belgesi"}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : isError || !s ? (
          <p className="py-8 text-center text-sm text-destructive">Satış getirilemedi.</p>
        ) : (
          <TeklifPdfOnizleme veri={veri} dosyaAdi={satisPdfDosyaAdi(s.SatisNo)} yukseklik="h-[70svh]" />
        )}
      </DialogContent>
    </Dialog>
  );
}
