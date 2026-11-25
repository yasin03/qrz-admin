"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { cn, normalize } from "@/lib/utils";
import { useCrmFinansCari } from "@/modules/crm/hooks/use-finans";
import { KISI_TIP_ETIKET } from "@/modules/crm/lib/kisiler";
import { gunFormat, paraFormat } from "@/modules/crm/lib/teklif";
import type { CrmFinansCariRow } from "@/modules/crm/types/finans";

type Props = {
  /** Satıra tıklanınca o müşterinin alacakları açılır. */
  onKisiSec: (k: CrmFinansCariRow) => void;
};

const tl = (v: number) => paraFormat(v, "TRY");

/** Müşteri bazında satış / tahsilat / bakiye (TL, satış kuruyla). */
export function BakiyeListesi({ onKisiSec }: Props) {
  const [arama, setArama] = useState("");
  const [sadeceBakiyeli, setSadeceBakiyeli] = useState(true);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility("crm-finans-bakiye-kolonlar");
  const { data: cari = [], isLoading, isError, refetch } = useCrmFinansCari({ SadeceBakiyeli: sadeceBakiyeli });

  const filtrelenmis = useMemo(() => {
    const q = normalize(arama.trim());
    return q ? cari.filter((k) => normalize(k.KisiAdi ?? "").includes(q)) : cari;
  }, [cari, arama]);

  const exportColumns = useMemo<ExportColumn<CrmFinansCariRow>[]>(
    () => [
      { header: "Kişi", accessorKey: "KisiAdi" },
      { header: "Kişi Tipi", accessorKey: (k) => KISI_TIP_ETIKET[k.KisiTip] },
      { header: "Satış Sayısı", accessorKey: "SatisSayisi", format: "number" },
      { header: "Açık Satış", accessorKey: "AcikSatisSayisi", format: "number" },
      { header: "Toplam Satış (TL)", accessorKey: "ToplamSatisTL", format: "money", total: true },
      { header: "Toplam Tahsilat (TL)", accessorKey: "ToplamTahsilatTL", format: "money", total: true },
      { header: "Bakiye (TL)", accessorKey: "BakiyeTL", format: "money", total: true },
      { header: "Son Tahsilat", accessorKey: (k) => (k.SonTahsilatTarihi ? gunFormat(k.SonTahsilatTarihi) : "") },
      { header: "Telefon", accessorKey: (k) => k.CepTelefon ?? k.YetkiliKisiTel ?? "" },
      { header: "E-posta", accessorKey: "YetkiliKisiEPostaAdresi" },
    ],
    [],
  );

  const columns = useMemo<ColumnDef<CrmFinansCariRow>[]>(
    () => [
      {
        id: "Kisi",
        accessorFn: (k) => k.KisiAdi ?? "",
        header: "Kişi",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate">
              {row.original.KisiAdi ?? "-"}
              {!row.original.KisiDurum && <Badge variant="gray">Pasif</Badge>}
            </p>
            <p className="text-xs text-muted-foreground">{KISI_TIP_ETIKET[row.original.KisiTip]}</p>
          </div>
        ),
      },
      {
        accessorKey: "SatisSayisi",
        header: "Satış",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.SatisSayisi}
            {row.original.AcikSatisSayisi > 0 && (
              <span className="text-muted-foreground"> ({row.original.AcikSatisSayisi} açık)</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "ToplamSatisTL",
        header: "Toplam Satış",
        meta: { align: "right" },
        cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{tl(row.original.ToplamSatisTL)}</span>,
      },
      {
        accessorKey: "ToplamTahsilatTL",
        header: "Toplam Tahsilat",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">{tl(row.original.ToplamTahsilatTL)}</span>
        ),
      },
      {
        accessorKey: "BakiyeTL",
        header: "Bakiye",
        meta: { align: "right" },
        cell: ({ row }) => {
          const b = row.original.BakiyeTL;
          return (
            <div className="whitespace-nowrap tabular-nums">
              <p className={cn("font-semibold", b > 0 && "text-destructive")}>{tl(b)}</p>
              {b < 0 && <p className="text-xs text-muted-foreground">iade borcu</p>}
            </div>
          );
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
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="crm-sadece-bakiyeli"
            checked={sadeceBakiyeli}
            onCheckedChange={(v) => setSadeceBakiyeli(v === true)}
          />
          <Label htmlFor="crm-sadece-bakiyeli" className="cursor-pointer font-normal">
            Sadece bakiyesi olanlar
          </Label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64 sm:shrink-0">
            <Input
              startIcon={<Search className="size-4" />}
              placeholder="Kişi ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ExportMenu
              data={filtrelenmis}
              exportColumns={exportColumns}
              title="Müşteri Bakiyeleri"
              fileName="musteri-bakiyeleri"
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
        getRowId={(k) => String(k.IDCrmKisi)}
        onRowClick={onKisiSec}
        pageResetKey={`${arama}|${sadeceBakiyeli}`}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? "Müşteri bakiyeleri getirilemedi."
            : arama
              ? "Aramaya uygun müşteri bulunamadı."
              : sadeceBakiyeli
                ? "Bakiyesi olan müşteri yok."
                : "Henüz satışı olan müşteri yok."
        }
        onRetry={isError ? () => refetch() : undefined}
      />
    </div>
  );
}
