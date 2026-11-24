"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTeklifDetay } from "@/modules/crm/hooks/use-teklif";
import { teklifPdfDosyaAdi, teklifPdfVerisiDetaydan } from "@/modules/crm/lib/teklif";
import type { DbId } from "@/modules/crm/types/teklif";

import { TeklifPdfOnizleme } from "./TeklifPdfOnizleme";

type Props = {
  /** Verilince açılır. */
  IDCrmTeklif: DbId | null;
  onOpenChange: (open: boolean) => void;
};

/** Kayıtlı teklifin PDF önizlemesi (indir / yazdır). */
export function TeklifPdfDialog({ IDCrmTeklif, onOpenChange }: Props) {
  const { data: t, isLoading, isError } = useTeklifDetay(IDCrmTeklif);
  const veri = useMemo(() => (t ? teklifPdfVerisiDetaydan(t) : null), [t]);

  return (
    <Dialog open={IDCrmTeklif != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Teklif PDF{t ? ` — ${t.TeklifNoTam}` : ""}</DialogTitle>
          <DialogDescription>{t?.Konu ?? "Teklif belgesi"}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : isError || !t ? (
          <p className="py-8 text-center text-sm text-destructive">Teklif getirilemedi.</p>
        ) : (
          <TeklifPdfOnizleme veri={veri} dosyaAdi={teklifPdfDosyaAdi(t.TeklifNoTam)} yukseklik="h-[70svh]" />
        )}
      </DialogContent>
    </Dialog>
  );
}
