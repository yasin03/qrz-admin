"use client";

import { useMemo, useState } from "react";
import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import { Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/modules/core/hooks/use-context";
import { useBolumler } from "@/modules/core/hooks/use-kurumsal-data";
import { usePdksRapor } from "@/modules/bordro/hooks/use-rapor";
import { normalize } from "@/lib/utils";
import {
  PdksRaporFilters,
  PdksRaporResponseType,
  PdksRaporSelectRequestType,
} from "@/modules/bordro/types/rapor";
import PdksRaporuFiltre, { ISLEM_OPTIONS } from "./PdksRaporuFiltre";

function getDefaultFilters(): PdksRaporFilters {
  const now = new Date();
  return {
    Tarih1: format(startOfMonth(now), "yyyy-MM-dd"),
    Tarih2: format(endOfMonth(now), "yyyy-MM-dd"),
    IDBolum: "0",
    IDSubePersonel: "0",
    Islem: "",
  };
}

const toGosterimTarihi = (tarih: string) =>
  format(parse(tarih, "yyyy-MM-dd", new Date()), "dd.MM.yyyy");

const PdksRaporu = () => {
  const { data: context } = useCurrentContext();
  const [filters, setFilters] = useState<PdksRaporFilters>(getDefaultFilters);
  const [searchText, setSearchText] = useState("");
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "pdks-raporu-kolonlar",
  );

  const IDSube = context?.IDSube;

  const { data: bolumlerData = [] } = useBolumler(Number(IDSube) || 0);
  const bolumler = useMemo(
    () =>
      bolumlerData.map((b) => ({
        IDBolum: String(b.IDBolum),
        BolumAdi: b.BolumAdi,
      })),
    [bolumlerData],
  );
  // Response'ta sadece IDBolum geliyor; tabloda bölüm adı gösteriliyor.
  const bolumAdlari = useMemo(
    () => new Map(bolumler.map((b) => [b.IDBolum, b.BolumAdi])),
    [bolumler],
  );
  const getBolumAdi = (row: PdksRaporResponseType) =>
    bolumAdlari.get(String(row.IDBolum)) ?? "-";

  const selectParams: PdksRaporSelectRequestType = useMemo(
    () => ({ IDSube: IDSube ?? "", ...filters }),
    [IDSube, filters],
  );

  const {
    data: raporData = [],
    isLoading,
    isError,
    refetch,
  } = usePdksRapor(selectParams);

  const filteredData = useMemo(() => {
    const search = normalize(searchText.trim());
    if (!search) return raporData;

    return raporData.filter((kayit) =>
      [kayit.AdSoyad, kayit.Tarih, getBolumAdi(kayit)].some(
        (value) => value && normalize(String(value)).includes(search),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raporData, searchText, bolumAdlari]);

  const islemLabel = ISLEM_OPTIONS.find(
    (o) => o.value === filters.Islem,
  )?.label;
  const tarihAraligi = `${toGosterimTarihi(filters.Tarih1)} - ${toGosterimTarihi(filters.Tarih2)}`;

  const exportColumns: ExportColumn<PdksRaporResponseType>[] = [
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Bölüm", accessorKey: getBolumAdi },
    { header: "Tarih", accessorKey: "Tarih" },
    { header: "Giriş", accessorKey: "Giris" },
    { header: "Çıkış", accessorKey: "Cikis" },
    { header: "Normal Süre", accessorKey: "NormalSure" },
    { header: "Mesai Süresi", accessorKey: "MesaiSure" },
    { header: "İzin Süresi", accessorKey: "IzinSure" },
    { header: "Toplam Süre", accessorKey: "ToplamSure" },
  ];

  const columns: ColumnDef<PdksRaporResponseType>[] = [
    { accessorKey: "AdSoyad", header: "Ad Soyad" },
    {
      id: "bolum",
      header: "Bölüm",
      accessorFn: getBolumAdi,
    },
    { accessorKey: "Tarih", header: "Tarih" },
    {
      accessorKey: "Giris",
      header: "Giriş",
      cell: ({ row }) => row.original.Giris ?? "-",
    },
    {
      accessorKey: "Cikis",
      header: "Çıkış",
      cell: ({ row }) => row.original.Cikis ?? "-",
    },
    {
      accessorKey: "NormalSure",
      header: "Normal Süre",
      cell: ({ row }) => row.original.NormalSure ?? "-",
    },
    {
      accessorKey: "MesaiSure",
      header: "Mesai Süresi",
      cell: ({ row }) => row.original.MesaiSure ?? "-",
    },
    {
      accessorKey: "IzinSure",
      header: "İzin Süresi",
      cell: ({ row }) => row.original.IzinSure ?? "-",
    },
    {
      accessorKey: "ToplamSure",
      header: "Toplam Süre",
      cell: ({ row }) => row.original.ToplamSure ?? "-",
    },
  ];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">PDKS Raporu</h1>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-muted-foreground text-sm sm:mr-auto">
          {tarihAraligi}
          {filters.Islem && ` · ${islemLabel}`}
        </p>
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PdksRaporuFiltre
            filters={filters}
            bolumler={bolumler}
            onChange={setFilters}
            onReset={() => setFilters(getDefaultFilters())}
          />
          <ExportMenu
            // Arama uygulanmış, ekranda görünen kayıtlar aktarılır
            data={filteredData}
            exportColumns={exportColumns}
            title={`PDKS Raporu${filters.Islem ? ` (${islemLabel})` : ""} - ${tarihAraligi}`}
            fileName={`pdks-raporu-${filters.Tarih1}-${filters.Tarih2}`}
          />
          <CustomColumnVisibility
            columns={columns}
            value={columnVisibility}
            onChange={setColumnVisibility}
          />
        </div>
      </div>

      <CustomDataTable
        data={filteredData}
        columns={columns}
        getRowId={(row) => String(row.IDSubePersonelSaat)}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        loading={isLoading}
        pagination
        emptyMessage={
          isError
            ? "Rapor yüklenirken hata oluştu."
            : "Seçilen kriterlere uygun kayıt bulunamadı."
        }
        onRetry={isError ? () => refetch() : undefined}
      />
    </div>
  );
};

export default PdksRaporu;
