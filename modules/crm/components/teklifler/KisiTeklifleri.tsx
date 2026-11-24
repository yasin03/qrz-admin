"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, FileText, Loader2 } from "lucide-react";

import { RowActions } from "@/components/customs/RowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { useTeklifler } from "@/modules/crm/hooks/use-teklif";
import { paraFormat, teklifDurumGorunum } from "@/modules/crm/lib/teklif";
import type { CrmKisiRow } from "@/modules/crm/types/kisiler";
import type { DbId, TeklifRow } from "@/modules/crm/types/teklif";

import { TeklifFormDialog, type TeklifFormModu } from "./TeklifFormDialog";
import { TeklifIslemDialog, teklifSatirAksiyonlari, type TeklifIslem } from "./TeklifIslemDialog";
import { TeklifPdfDialog } from "./TeklifPdfDialog";

type Props = {
  kisi: Pick<CrmKisiRow, "IDCrmKisi">;
};

const detayLinki = (t: TeklifRow) => `/crm/teklifler?teklif=${t.IDCrmTeklif}`;

/** Kişi detayındaki teklifler: oluştur, durum işlemleri; ayrıntı Teklifler sayfasında açılır. */
export function KisiTeklifleri({ kisi }: Props) {
  const { data = [], isLoading, isError, refetch } = useTeklifler({ IDCrmKisi: kisi.IDCrmKisi });
  const [formMod, setFormMod] = useState<TeklifFormModu | null>(null);
  const [islem, setIslem] = useState<TeklifIslem | null>(null);
  const [pdfID, setPdfID] = useState<DbId | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Teklifler</h3>
        <Button size="sm" appearance="outline" onClick={() => setFormMod({ tip: "yeni", IDCrmKisi: kisi.IDCrmKisi })}>
          <FilePlus2 /> Teklif Oluştur
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="py-4 text-center text-sm text-destructive">
          Teklifler getirilemedi.{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            Tekrar dene
          </button>
        </div>
      ) : data.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Henüz teklif yok.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.map((t) => {
            const d = teklifDurumGorunum(t);
            return (
              <li key={String(t.IDCrmTeklif)} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <Link href={detayLinki(t)} className="min-w-0 flex-1 hover:underline">
                  <p className="truncate text-sm font-medium">{t.Konu}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.TeklifNoTam} · {formatDate(t.TeklifTarihi)}
                  </p>
                </Link>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {paraFormat(t.GenelToplam, t.ParaBirimi)}
                </span>
                <Badge variant={d.variant} className="shrink-0">
                  {d.label}
                </Badge>
                <RowActions
                  row={t}
                  actions={teklifSatirAksiyonlari<TeklifRow>({
                    onGoruntule: (r) => router.push(detayLinki(r)),
                    onPdf: (r) => setPdfID(r.IDCrmTeklif),
                    onDuzenle: (r) => setFormMod({ tip: "duzenle", IDCrmTeklif: r.IDCrmTeklif }),
                    onIslem: (tip, r) => setIslem({ tip, teklif: r }),
                  })}
                />
              </li>
            );
          })}
        </ul>
      )}

      <TeklifFormDialog open={!!formMod} onOpenChange={(v) => !v && setFormMod(null)} mod={formMod} />
      <TeklifIslemDialog islem={islem} onOpenChange={(v) => !v && setIslem(null)} />
      <TeklifPdfDialog IDCrmTeklif={pdfID} onOpenChange={(v) => !v && setPdfID(null)} />
    </div>
  );
}
