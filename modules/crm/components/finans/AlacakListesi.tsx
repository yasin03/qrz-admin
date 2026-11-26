"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, FileText, HandCoins, RotateCcw, Search, X } from "lucide-react";

import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions, type RowAction } from "@/components/customs/RowActions";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { cn, normalize } from "@/lib/utils";
import { useCrmFinansAlacaklar } from "@/modules/crm/hooks/use-finans";
import { ODEME_DURUM } from "@/modules/crm/lib/finans";
import { KISI_TIP_ETIKET } from "@/modules/crm/lib/kisiler";
import { SATIS_TIPI_ETIKET } from "@/modules/crm/lib/satis";
import { gunFormat, paraFormat } from "@/modules/crm/lib/teklif";
import type { CrmFinansSatisRow, DbId } from "@/modules/crm/types/finans";

import { AlacakFiltre, BOS_ALACAK_FILTRELERI, type AlacakFiltreleri } from "./AlacakFiltre";
import type { TahsilatFormModu, TahsilatSatisBilgisi } from "./TahsilatFormDialog";

const ARANAN_ALANLAR = ["SatisNo", "KisiAdi", "Konu"] as const;

type Props = {
  /** Müşteri bakiyelerinden gelindiyse o kişinin alacakları. */
  kisi: { IDCrmKisi: DbId; KisiAdi: string | null } | null;
  onKisiTemizle: () => void;
  /** Satışı Finans sekmesinde (drawer) açar. */
  onSatisAc: (IDCrmSatis: DbId) => void;
  onTahsilat: (mod: TahsilatFormModu) => void;
  /** Kişi filtresi varken o kişinin hesap ekstresi. */
  onEkstre: (kisi: { IDCrmKisi: DbId; KisiAdi: string | null }) => void;
};

const satisBilgisi = (a: CrmFinansSatisRow): TahsilatSatisBilgisi => ({
  IDCrmSatis: a.IDCrmSatis,
  SatisNo: a.SatisNo,
  KisiAdi: a.KisiAdi,
  ParaBirimi: a.ParaBirimi,
  Kalan: a.Kalan,
  TahsilEdilen: a.TahsilEdilen,
});

/** Ana çalışma listesi: kalanı olan satışlar (eskiden yeniye) ve iade bekleyenler. */
export function AlacakListesi({ kisi, onKisiTemizle, onSatisAc, onTahsilat, onEkstre }: Props) {
  const [arama, setArama] = useState("");
  const [filters, setFilters] = useState<AlacakFiltreleri>(BOS_ALACAK_FILTRELERI);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility("crm-finans-alacak-kolonlar");

  const {
    data: alacaklar = [],
    isLoading,
    isError,
    refetch,
  } = useCrmFinansAlacaklar({ IDCrmKisi: kisi?.IDCrmKisi ?? null, SadeceAcik: filters.SadeceAcik });

  const filtrelenmis = useMemo(() => {
    const q = normalize(arama.trim());
    return alacaklar.filter((a) => {
      if (filters.OdemeDurumu && String(a.OdemeDurumu) !== filters.OdemeDurumu) return false;
      if (filters.ParaBirimi && a.ParaBirimi !== filters.ParaBirimi) return false;
      if (!q) return true;
      return ARANAN_ALANLAR.some((alan) => normalize(a[alan] ?? "").includes(q));
    });
  }, [alacaklar, arama, filters]);

  const handleFilterChange = useCallback((next: AlacakFiltreleri) => setFilters(next), []);
  const handleFilterReset = useCallback(() => setFilters(BOS_ALACAK_FILTRELERI), []);

  const aksiyonlar = useMemo<RowAction<CrmFinansSatisRow>[]>(
    () => [
      {
        label: "Tahsilat Ekle",
        icon: HandCoins,
        // İptal edilmiş satışa sadece iade girilir (SP kuralı).
        hidden: (a) => a.Durum !== 0 || a.Kalan <= 0,
        onClick: (a) => onTahsilat({ tip: "yeni", satis: satisBilgisi(a), Tip: 1 }),
      },
      {
        label: "İade Ekle",
        icon: RotateCcw,
        hidden: (a) => a.TahsilEdilen <= 0,
        onClick: (a) => onTahsilat({ tip: "yeni", satis: satisBilgisi(a), Tip: 2 }),
      },
      { divider: true },
      { label: "Satışı Görüntüle", icon: Eye, onClick: (a) => onSatisAc(a.IDCrmSatis) },
    ],
    [onSatisAc, onTahsilat],
  );

  const exportColumns = useMemo<ExportColumn<CrmFinansSatisRow>[]>(
    () => [
      { header: "Satış No", accessorKey: "SatisNo" },
      { header: "Kişi", accessorKey: "KisiAdi" },
      { header: "Konu", accessorKey: "Konu" },
      { header: "Satış Tipi", accessorKey: (a) => SATIS_TIPI_ETIKET[a.SatisTipi] },
      { header: "Satış Tarihi", accessorKey: (a) => gunFormat(a.SatisTarihi) },
      { header: "Para Birimi", accessorKey: "ParaBirimi" },
      { header: "Toplam", accessorKey: "Borc", format: "number" },
      { header: "Tahsil Edilen", accessorKey: "TahsilEdilen", format: "number" },
      { header: "Kalan", accessorKey: "Kalan", format: "number" },
      { header: "Kalan (TL)", accessorKey: "KalanTL", format: "money", total: true },
      { header: "Ödeme", accessorKey: (a) => (a.OdemeDurumu == null ? "" : ODEME_DURUM[a.OdemeDurumu].label) },
      { header: "Son Tahsilat", accessorKey: (a) => (a.SonTahsilatTarihi ? gunFormat(a.SonTahsilatTarihi) : "") },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<CrmFinansSatisRow>[]>(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => <RowActions row={row.original} actions={aksiyonlar} />,
      },
      {
        accessorKey: "SatisNo",
        header: "Satış No",
        cell: ({ row }) => <span className="font-medium whitespace-nowrap">{row.original.SatisNo}</span>,
      },
      {
        id: "Kisi",
        accessorFn: (a) => a.KisiAdi ?? "",
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
        accessorKey: "SatisTarihi",
        header: "Satış Tarihi",
        cell: ({ row }) => <span className="whitespace-nowrap">{gunFormat(row.original.SatisTarihi)}</span>,
      },
      {
        accessorKey: "Borc",
        header: "Toplam",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {paraFormat(row.original.Borc, row.original.ParaBirimi)}
          </span>
        ),
      },
      {
        accessorKey: "TahsilEdilen",
        header: "Tahsil Edilen",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {paraFormat(row.original.TahsilEdilen, row.original.ParaBirimi)}
          </span>
        ),
      },
      {
        accessorKey: "Kalan",
        header: "Kalan",
        meta: { align: "right" },
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="whitespace-nowrap tabular-nums">
              <p className={cn("font-medium", a.Kalan > 0 && "text-destructive")}>
                {paraFormat(a.Kalan, a.ParaBirimi)}
              </p>
              {a.ParaBirimi !== "TRY" && (
                <p className="text-xs text-muted-foreground">{paraFormat(a.KalanTL, "TRY")}</p>
              )}
            </div>
          );
        },
      },
      {
        id: "Odeme",
        accessorFn: (a) => a.OdemeDurumu ?? -1,
        header: "Ödeme",
        cell: ({ row }) => {
          const d = row.original.OdemeDurumu;
          return d == null ? null : <Badge variant={ODEME_DURUM[d].variant}>{ODEME_DURUM[d].label}</Badge>;
        },
      },
      {
        accessorKey: "SonTahsilatTarihi",
        header: "Son Tahsilat",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.SonTahsilatTarihi ? gunFormat(row.original.SonTahsilatTarihi) : "-"}
          </span>
        ),
      },
    ],
    [aksiyonlar],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {kisi && (
            <>
              <Badge variant="primary" className="gap-1">
                {kisi.KisiAdi ?? "Kişi"}
                <button type="button" onClick={onKisiTemizle} aria-label="Kişi filtresini kaldır">
                  <X className="size-3" />
                </button>
              </Badge>
              <Button size="sm" appearance="outline" onClick={() => onEkstre(kisi)}>
                <FileText /> Hesap Ekstresi
              </Button>
            </>
          )}
        </div>
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
            <AlacakFiltre filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />
            <ExportMenu data={filtrelenmis} exportColumns={exportColumns} title="Alacaklar" fileName="alacaklar" />
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
        getRowId={(a) => String(a.IDCrmSatis)}
        onRowClick={(a) => onSatisAc(a.IDCrmSatis)}
        pageResetKey={`${arama}|${JSON.stringify(filters)}|${kisi?.IDCrmKisi ?? ""}`}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? "Alacak listesi getirilemedi."
            : arama || filtrelenmis.length !== alacaklar.length
              ? "Arama veya filtreye uygun alacak bulunamadı."
              : filters.SadeceAcik
                ? "Açık alacak yok, tüm satışlar ödenmiş."
                : "Henüz satış yok."
        }
        onRetry={isError ? () => refetch() : undefined}
      />
    </div>
  );
}
