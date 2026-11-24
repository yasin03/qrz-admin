"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search } from "lucide-react";

import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { formatDate } from "@/lib/format";
import { cn, normalize } from "@/lib/utils";
import { useTeklifler } from "@/modules/crm/hooks/use-teklif";
import { KISI_TIP_ETIKET } from "@/modules/crm/lib/kisiler";
import { paraFormat, teklifDurumGorunum } from "@/modules/crm/lib/teklif";
import type { DbId, TeklifRow } from "@/modules/crm/types/teklif";

import { TeklifDrawer } from "./TeklifDrawer";
import { BOS_TEKLIF_FILTRELERI, TeklifFiltre, type TeklifFiltreleri } from "./TeklifFiltre";
import { TeklifFormDialog, type TeklifFormModu } from "./TeklifFormDialog";
import { TeklifIslemDialog, teklifSatirAksiyonlari, type TeklifIslem } from "./TeklifIslemDialog";
import { TeklifPdfDialog } from "./TeklifPdfDialog";

const ARANAN_ALANLAR = ["TeklifNoTam", "KisiAdi", "Konu", "Ad"] as const;

/** Açık teklif adreste (?teklif=ID) tutulur; kişi ekranından link ile gelinebilir. */
function useSeciliTeklif() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const secili = searchParams.get("teklif");

  const setSecili = useCallback(
    (id: DbId | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id == null) params.delete("teklif");
      else params.set("teklif", String(id));
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, searchParams],
  );

  return [secili, setSecili] as const;
}

const TekliflerPage = () => {
  const { data: teklifler = [], isLoading, isError, refetch } = useTeklifler();

  const [arama, setArama] = useState("");
  const [filters, setFilters] = useState<TeklifFiltreleri>(BOS_TEKLIF_FILTRELERI);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility("crm-teklif-kolonlar");
  const [formMod, setFormMod] = useState<TeklifFormModu | null>(null);
  const [islem, setIslem] = useState<TeklifIslem | null>(null);
  const [pdfID, setPdfID] = useState<DbId | null>(null);
  const [seciliID, setSeciliID] = useSeciliTeklif();

  const filtrelenmis = useMemo(() => {
    const q = normalize(arama.trim());
    return teklifler.filter((t) => {
      if (filters.Durum === "SURESI_DOLDU") {
        if (!(t.Durum === 1 && t.SuresiDoldu)) return false;
      } else if (filters.Durum && String(t.Durum) !== filters.Durum) return false;
      if (filters.ParaBirimi && t.ParaBirimi !== filters.ParaBirimi) return false;
      if (filters.KisiTip && t.KisiTip !== filters.KisiTip) return false;
      if (!q) return true;
      return ARANAN_ALANLAR.some((alan) => normalize(t[alan] ?? "").includes(q));
    });
  }, [teklifler, arama, filters]);

  // TL karşılığı sadece döviz teklifleri için anlamlı; hiç döviz teklifi
  // yoksa kolon gösterilmez (filtreyle kolon zıplamasın diye tüm listeye bakılır).
  const dovizVar = useMemo(() => teklifler.some((t) => t.ParaBirimi !== "TRY"), [teklifler]);

  const handleFilterChange = useCallback((next: TeklifFiltreleri) => setFilters(next), []);
  const handleFilterReset = useCallback(() => setFilters(BOS_TEKLIF_FILTRELERI), []);

  const exportColumns = useMemo<ExportColumn<TeklifRow>[]>(
    () => [
      { header: "Teklif No", accessorKey: "TeklifNoTam" },
      { header: "Kişi", accessorKey: "KisiAdi" },
      { header: "Kişi Tipi", accessorKey: (t) => KISI_TIP_ETIKET[t.KisiTip] },
      { header: "Konu", accessorKey: "Konu" },
      { header: "Teklif Tarihi", accessorKey: "TeklifTarihi" },
      { header: "Geçerlilik", accessorKey: "GecerlilikTarihi" },
      { header: "Durum", accessorKey: (t) => teklifDurumGorunum(t).label },
      { header: "Para Birimi", accessorKey: "ParaBirimi" },
      { header: "Ara Toplam", accessorKey: "AraToplam", format: "number" },
      { header: "İskonto", accessorKey: "IskontoToplam", format: "number" },
      { header: "KDV", accessorKey: "KdvToplam", format: "number" },
      // Hepsi TL ise genel toplam doğrudan toplanır; döviz varsa toplam TL karşılığından alınır.
      dovizVar
        ? { header: "Genel Toplam", accessorKey: "GenelToplam", format: "number" }
        : { header: "Genel Toplam", accessorKey: "GenelToplam", format: "money", total: true },
      ...(dovizVar
        ? [{ header: "TL Karşılığı", accessorKey: "GenelToplamTL", format: "money", total: true } as const]
        : []),
      { header: "Hazırlayan", accessorKey: "Ad" },
    ],
    [dovizVar],
  );

  const columns = useMemo<ColumnDef<TeklifRow>[]>(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={teklifSatirAksiyonlari<TeklifRow>({
              onGoruntule: (t) => setSeciliID(t.IDCrmTeklif),
              onPdf: (t) => setPdfID(t.IDCrmTeklif),
              onDuzenle: (t) => setFormMod({ tip: "duzenle", IDCrmTeklif: t.IDCrmTeklif }),
              onIslem: (tip, t) => setIslem({ tip, teklif: t }),
            })}
          />
        ),
      },
      {
        accessorKey: "TeklifNoTam",
        header: "Teklif No",
        cell: ({ row }) => <span className="font-medium whitespace-nowrap">{row.original.TeklifNoTam}</span>,
      },
      {
        id: "Kisi",
        accessorFn: (t) => t.KisiAdi ?? "",
        header: "Kişi",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.KisiAdi ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{KISI_TIP_ETIKET[row.original.KisiTip]}</p>
          </div>
        ),
      },
      {
        accessorKey: "Konu",
        header: "Konu",
        cell: ({ row }) => <span className="line-clamp-2">{row.original.Konu}</span>,
      },
      {
        accessorKey: "TeklifTarihi",
        header: "Tarih",
        cell: ({ row }) => <span>{formatDate(row.original.TeklifTarihi)}</span>,
      },
      {
        accessorKey: "GecerlilikTarihi",
        header: "Geçerlilik",
        cell: ({ row }) => (
          <span className={cn(row.original.SuresiDoldu && "font-medium text-destructive")}>
            {formatDate(row.original.GecerlilikTarihi)}
          </span>
        ),
      },
      {
        id: "Durum",
        accessorFn: (t) => teklifDurumGorunum(t).label,
        header: "Durum",
        cell: ({ row }) => {
          const d = teklifDurumGorunum(row.original);
          return <Badge variant={d.variant}>{d.label}</Badge>;
        },
      },
      {
        accessorKey: "GenelToplam",
        header: "Genel Toplam",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap tabular-nums">
            {paraFormat(row.original.GenelToplam, row.original.ParaBirimi)}
          </span>
        ),
      },
      ...(dovizVar
        ? ([
            {
              accessorKey: "GenelToplamTL",
              header: "TL Karşılığı",
              meta: { align: "right" },
              // TL tekliflerde aynı tutar tekrar edilmez.
              cell: ({ row }) =>
                row.original.ParaBirimi === "TRY" ? null : (
                  <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {paraFormat(row.original.GenelToplamTL, "TRY")}
                  </span>
                ),
            },
          ] satisfies ColumnDef<TeklifRow>[])
        : []),
      {
        id: "Hazirlayan",
        accessorFn: (t) => t.Ad ?? t.KullaniciAdi ?? "",
        header: "Hazırlayan",
        cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>,
      },
    ],
    [setSeciliID, dovizVar],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="mb-0 text-xl font-bold sm:text-2xl">Teklifler</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64 sm:shrink-0">
            <Input
              startIcon={<Search className="size-4" />}
              placeholder="No, kişi, konu ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TeklifFiltre filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />
            <Button type="button" size="sm" onClick={() => setFormMod({ tip: "yeni" })}>
              <Plus className="size-4" />
              Yeni Teklif
            </Button>
            <ExportMenu
              data={filtrelenmis}
              exportColumns={exportColumns}
              title="Teklif Listesi"
              fileName="teklif-listesi"
            />
            <div className="shrink-0">
              <CustomColumnVisibility columns={columns} value={columnVisibility} onChange={setColumnVisibility} />
            </div>
          </div>
        </div>
      </div>

      <CustomDataTable
        data={filtrelenmis}
        columns={columns}
        loading={isLoading}
        getRowId={(t) => String(t.IDCrmTeklif)}
        onRowClick={(t) => setSeciliID(t.IDCrmTeklif)}
        pageResetKey={`${arama}|${JSON.stringify(filters)}`}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? "Teklif listesi getirilemedi."
            : arama || filtrelenmis.length !== teklifler.length
              ? "Arama veya filtreye uygun teklif bulunamadı."
              : "Henüz teklif oluşturulmadı."
        }
        onRetry={isError ? () => refetch() : undefined}
      />

      <TeklifDrawer
        IDCrmTeklif={seciliID}
        onOpenChange={(v) => !v && setSeciliID(null)}
        onDuzenle={(t) => setFormMod({ tip: "duzenle", IDCrmTeklif: t.IDCrmTeklif })}
        onIslem={(tip, t) => setIslem({ tip, teklif: t })}
        onSec={(id) => setSeciliID(id)}
        onPdf={(t) => setPdfID(t.IDCrmTeklif)}
      />

      <TeklifPdfDialog IDCrmTeklif={pdfID} onOpenChange={(v) => !v && setPdfID(null)} />

      <TeklifFormDialog
        open={!!formMod}
        onOpenChange={(v) => !v && setFormMod(null)}
        mod={formMod}
        onKaydedildi={(id) => setSeciliID(id)}
      />

      <TeklifIslemDialog
        islem={islem}
        onOpenChange={(v) => !v && setIslem(null)}
        onTamamlandi={(tip, yeniID) => {
          // Revizyonda yeni taslak açılır; silinen taslağın drawer'ı kapanır.
          if (tip === "revize" && yeniID != null) setSeciliID(yeniID);
          if (tip === "sil") setSeciliID(null);
        }}
      />
    </div>
  );
};

export default TekliflerPage;
