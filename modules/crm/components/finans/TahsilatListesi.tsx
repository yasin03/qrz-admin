"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
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
import { useCrmTahsilatlar, useDeleteCrmTahsilat } from "@/modules/crm/hooks/use-finans";
import { ODEME_SEKLI_ETIKET, TAHSILAT_TIP, donemAraligi } from "@/modules/crm/lib/finans";
import { gunFormat, paraFormat } from "@/modules/crm/lib/teklif";
import type { CrmTahsilatRow, DbId } from "@/modules/crm/types/finans";

import { BOS_TAHSILAT_FILTRELERI, TahsilatFiltre, type TahsilatFiltreleri } from "./TahsilatFiltre";
import type { TahsilatFormModu } from "./TahsilatFormDialog";

const ARANAN_ALANLAR = ["SatisNo", "KisiAdi", "FaturaNo", "Aciklama", "SatisKonu"] as const;

type Props = {
  onSatisAc: (IDCrmSatis: DbId) => void;
  onTahsilat: (mod: TahsilatFormModu) => void;
};

/** Para hareketleri (tahsilat + iade), tarih aralığına göre. TL toplamı tahsilat günü kuruyla. */
export function TahsilatListesi({ onSatisAc, onTahsilat }: Props) {
  const [arama, setArama] = useState("");
  const [filters, setFilters] = useState<TahsilatFiltreleri>(BOS_TAHSILAT_FILTRELERI);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility("crm-finans-tahsilat-kolonlar");
  const [silinecek, setSilinecek] = useState<CrmTahsilatRow | null>(null);
  const sil = useDeleteCrmTahsilat();

  const aralik =
    filters.Donem === "ozel" ? { Baslangic: filters.Baslangic, Bitis: filters.Bitis } : donemAraligi(filters.Donem);
  const {
    data: tahsilatlar = [],
    isLoading,
    isError,
    refetch,
  } = useCrmTahsilatlar({
    Baslangic: aralik.Baslangic || null,
    Bitis: aralik.Bitis || null,
    Tip: filters.Tip ? (Number(filters.Tip) as 1 | 2) : null,
  });

  const filtrelenmis = useMemo(() => {
    const q = normalize(arama.trim());
    return tahsilatlar.filter((t) => {
      if (filters.OdemeSekli && String(t.OdemeSekli) !== filters.OdemeSekli) return false;
      if (!q) return true;
      return ARANAN_ALANLAR.some((alan) => normalize(t[alan] ?? "").includes(q));
    });
  }, [tahsilatlar, arama, filters.OdemeSekli]);

  const handleFilterChange = useCallback((next: TahsilatFiltreleri) => setFilters(next), []);
  const handleFilterReset = useCallback(() => setFilters(BOS_TAHSILAT_FILTRELERI), []);

  const silOnayla = async () => {
    if (!silinecek) return;
    try {
      await sil.mutateAsync(silinecek.IDCrmTahsilat);
      toast.success(silinecek.Tip === 2 ? "İade silindi." : "Tahsilat silindi.");
      setSilinecek(null);
    } catch (error) {
      toast.error((error as Error)?.message || "Kayıt silinemedi.");
    }
  };

  const aksiyonlar = useMemo<RowAction<CrmTahsilatRow>[]>(
    () => [
      {
        label: "Düzenle",
        icon: Pencil,
        onClick: (t) => onTahsilat({ tip: "duzenle", IDCrmTahsilat: t.IDCrmTahsilat }),
      },
      { label: "Satışı Görüntüle", icon: Eye, onClick: (t) => onSatisAc(t.IDCrmSatis) },
      { divider: true },
      { label: "Sil", icon: Trash2, variant: "danger", onClick: (t) => setSilinecek(t) },
    ],
    [onSatisAc, onTahsilat],
  );

  const exportColumns = useMemo<ExportColumn<CrmTahsilatRow>[]>(
    () => [
      { header: "Tarih", accessorKey: (t) => gunFormat(t.Tarih) },
      { header: "Tip", accessorKey: (t) => TAHSILAT_TIP[t.Tip].label },
      { header: "Kişi", accessorKey: "KisiAdi" },
      { header: "Satış No", accessorKey: "SatisNo" },
      { header: "Para Birimi", accessorKey: "ParaBirimi" },
      { header: "Tutar", accessorKey: "IsaretliTutar", format: "number" },
      { header: "Kur", accessorKey: "Kur", format: "number" },
      { header: "Tutar (TL)", accessorKey: "TutarTL", format: "money", total: true },
      { header: "Ödeme Şekli", accessorKey: (t) => ODEME_SEKLI_ETIKET[t.OdemeSekli] },
      { header: "Fatura No", accessorKey: "FaturaNo" },
      { header: "Fatura Tarihi", accessorKey: (t) => (t.FaturaTarihi ? gunFormat(t.FaturaTarihi) : "") },
      { header: "Açıklama", accessorKey: "Aciklama" },
      { header: "Giren", accessorKey: "Ad" },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<CrmTahsilatRow>[]>(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => <RowActions row={row.original} actions={aksiyonlar} />,
      },
      {
        accessorKey: "Tarih",
        header: "Tarih",
        cell: ({ row }) => <span className="whitespace-nowrap">{gunFormat(row.original.Tarih)}</span>,
      },
      {
        id: "Tip",
        accessorFn: (t) => TAHSILAT_TIP[t.Tip].label,
        header: "Tip",
        cell: ({ row }) => {
          const d = TAHSILAT_TIP[row.original.Tip];
          return <Badge variant={d.variant}>{d.label}</Badge>;
        },
      },
      {
        id: "Kisi",
        accessorFn: (t) => t.KisiAdi ?? "",
        header: "Kişi",
        cell: ({ row }) => <span className="truncate">{row.original.KisiAdi ?? "-"}</span>,
      },
      {
        accessorKey: "SatisNo",
        header: "Satış",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium whitespace-nowrap">{row.original.SatisNo}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.SatisKonu}</p>
          </div>
        ),
      },
      {
        accessorKey: "IsaretliTutar",
        header: "Tutar",
        meta: { align: "right" },
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="whitespace-nowrap tabular-nums">
              <p className={cn("font-medium", t.Tip === 2 && "text-destructive")}>
                {paraFormat(t.IsaretliTutar, t.ParaBirimi)}
              </p>
              {t.ParaBirimi !== "TRY" && (
                <p className="text-xs text-muted-foreground">{paraFormat(t.TutarTL, "TRY")}</p>
              )}
            </div>
          );
        },
      },
      {
        id: "OdemeSekli",
        accessorFn: (t) => ODEME_SEKLI_ETIKET[t.OdemeSekli],
        header: "Ödeme Şekli",
        cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as string}</span>,
      },
      {
        accessorKey: "FaturaNo",
        header: "Fatura",
        cell: ({ row }) =>
          row.original.FaturaNo ? (
            <div className="whitespace-nowrap">
              <p>{row.original.FaturaNo}</p>
              {row.original.FaturaTarihi && (
                <p className="text-xs text-muted-foreground">{gunFormat(row.original.FaturaTarihi)}</p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "Giren",
        accessorFn: (t) => t.Ad ?? t.KullaniciAdi ?? "",
        header: "Giren",
        cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>,
      },
    ],
    [aksiyonlar],
  );

  // Ekranda da dönem toplamı görünsün (TL, iadeler eksi).
  const toplamTL = useMemo(() => filtrelenmis.reduce((s, t) => s + t.TutarTL, 0), [filtrelenmis]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtrelenmis.length} kayıt · Net:{" "}
          <span className="font-semibold text-foreground tabular-nums">{paraFormat(toplamTL, "TRY")}</span>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64 sm:shrink-0">
            <Input
              startIcon={<Search className="size-4" />}
              placeholder="Satış no, kişi, fatura ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TahsilatFiltre filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />
            <Button type="button" size="sm" onClick={() => onTahsilat({ tip: "yeni" })}>
              <Plus className="size-4" />
              Yeni Tahsilat
            </Button>
            <ExportMenu
              data={filtrelenmis}
              exportColumns={exportColumns}
              title="Tahsilatlar"
              fileName="tahsilatlar"
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
        getRowId={(t) => String(t.IDCrmTahsilat)}
        onRowClick={(t) => onTahsilat({ tip: "duzenle", IDCrmTahsilat: t.IDCrmTahsilat })}
        pageResetKey={`${arama}|${JSON.stringify(filters)}`}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? "Tahsilat listesi getirilemedi."
            : arama || filtrelenmis.length !== tahsilatlar.length
              ? "Arama veya filtreye uygun kayıt bulunamadı."
              : "Bu dönemde tahsilat yok."
        }
        onRetry={isError ? () => refetch() : undefined}
      />

      <ConfirmDialog
        open={!!silinecek}
        onOpenChange={(v) => !v && setSilinecek(null)}
        title={silinecek?.Tip === 2 ? "İadeyi sil" : "Tahsilatı sil"}
        description={
          silinecek
            ? `${gunFormat(silinecek.Tarih)} tarihli ${paraFormat(silinecek.Tutar, silinecek.ParaBirimi)} tutarındaki kayıt kalıcı olarak silinecek; ${silinecek.SatisNo} satışının kalanı buna göre değişir. Bu işlem geri alınamaz.`
            : undefined
        }
        confirmLabel="Sil"
        variant="danger"
        isLoading={sil.isPending}
        onConfirm={silOnayla}
      />
    </div>
  );
}
