"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/modules/core/hooks/use-context";
import { useAvansRapor } from "@/modules/bordro/hooks/use-rapor";
import { useSirketSubeFiltre } from "@/modules/core/hooks/genel/use-sirket-sube-filtre";
import {
  AvansRaporFilters,
  AvansRaporResponseType,
  AvansRaporSelectRequestType,
} from "@/modules/bordro/types/rapor";
import {
  personelKolonu,
  raporAra,
  SARILAN_HUCRE,
  sayiKolonu,
  subeKoduKolonu,
  tarihAraligiMetni,
  tarihMetniParse,
  tarihMetniSort,
  temizAdSoyad,
  yilAraligi,
} from "../rapor-utils";
import AvansRaporuFiltre from "./AvansRaporuFiltre";

const AvansRaporu = () => {
  const { data: context } = useCurrentContext();
  const sirketSube = useSirketSubeFiltre();

  // null → session yılının tamamı
  const [tarihSecimi, setTarihSecimi] = useState<AvansRaporFilters | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "avans-raporu-kolonlar",
  );

  const tarih =
    tarihSecimi ?? yilAraligi(context?.Yil || new Date().getFullYear());

  const selectParams: AvansRaporSelectRequestType = useMemo(
    () => ({
      IDSirket: sirketSube.IDSirket,
      IDSube: sirketSube.IDSube,
      BaslangicTarihi: tarih.BaslangicTarihi,
      BitisTarihi: tarih.BitisTarihi,
    }),
    [
      sirketSube.IDSirket,
      sirketSube.IDSube,
      tarih.BaslangicTarihi,
      tarih.BitisTarihi,
    ],
  );

  const {
    data: raporData = [],
    isLoading,
    isError,
    refetch,
  } = useAvansRapor(selectParams);

  const filteredData = useMemo(
    () =>
      raporAra(raporData, searchText, (row) => [
        temizAdSoyad(row.AdSoyad),
        row.TcKimlikNo,
      ]),
    [raporData, searchText],
  );

  const tarihAraligi = tarihAraligiMetni(
    tarih.BaslangicTarihi,
    tarih.BitisTarihi,
  );
  const altBaslik = `${tarihAraligi} · ${sirketSube.seciliSube}`;

  const exportColumns: ExportColumn<AvansRaporResponseType>[] = [
    { header: "Şube Kodu", accessorKey: "SubeKodu" },
    { header: "TC Kimlik No", accessorKey: "TcKimlikNo" },
    { header: "Ad Soyad", accessorKey: (row) => temizAdSoyad(row.AdSoyad) },
    { header: "Evrak No", accessorKey: (row) => row.EvrakNo || "-" },
    {
      header: "Kesinti Tarihi",
      accessorKey: (row) => tarihMetniParse(row.KesintiTarihi2),
      format: "date",
    },
    {
      header: "Ödeme Başlangıç Tarihi",
      accessorKey: (row) => tarihMetniParse(row.OdemeBaslangicTarihi),
      format: "date",
    },
    { header: "Tutar", accessorKey: "Tutar", format: "money", total: true },
    {
      header: "Bordro Kesinti Tutarı",
      accessorKey: "BordroKesintiTutari",
      format: "money",
      total: true,
    },
    { header: "Açıklama", accessorKey: "Aciklama" },
  ];

  const columns: ColumnDef<AvansRaporResponseType>[] = [
    subeKoduKolonu(),
    personelKolonu(),
    {
      accessorKey: "EvrakNo",
      header: "Evrak No",
      cell: ({ row }) => row.original.EvrakNo || "-",
    },
    {
      accessorKey: "KesintiTarihi2",
      header: "Kesinti Tarihi",
      sortingFn: tarihMetniSort,
      cell: ({ row }) => row.original.KesintiTarihi2 || "-",
    },
    {
      accessorKey: "OdemeBaslangicTarihi",
      header: "Ödeme Başlangıç Tarihi",
      sortingFn: tarihMetniSort,
      cell: ({ row }) => row.original.OdemeBaslangicTarihi || "-",
    },
    sayiKolonu("Tutar", "Tutar", { money: true }),
    sayiKolonu("BordroKesintiTutari", "Bordro Kesinti Tutarı", {
      money: true,
    }),
    {
      accessorKey: "Aciklama",
      header: "Açıklama",
      meta: SARILAN_HUCRE,
      cell: ({ row }) => row.original.Aciklama || "-",
    },
  ];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Avans Raporları</h1>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-muted-foreground text-sm sm:mr-auto">{altBaslik}</p>
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AvansRaporuFiltre
            filters={tarih}
            sirketSube={sirketSube}
            onChange={setTarihSecimi}
            onReset={() => {
              setTarihSecimi(null);
              sirketSube.sifirla();
            }}
          />
          <ExportMenu
            // Arama uygulanmış, ekranda görünen kayıtlar aktarılır
            data={filteredData}
            exportColumns={exportColumns}
            title="Avans Raporu"
            subtitle={altBaslik}
            fileName={`avans-raporu-${tarih.BaslangicTarihi}-${tarih.BitisTarihi}`}
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
        getRowId={(row) => String(row.IDSubePersonelAvans)}
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

export default AvansRaporu;
