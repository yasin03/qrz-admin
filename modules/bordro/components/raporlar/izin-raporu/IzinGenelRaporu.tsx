"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useIzinRaporGenel } from "@/modules/bordro/hooks/use-rapor";
import {
  IzinRaporGenelResponseType,
  IzinRaporGenelSelectRequestType,
  RaporTarihFilters,
} from "@/modules/bordro/types/rapor";
import {
  isoTarihKolonu,
  isoTarihParse,
  personelKolonu,
  raporAra,
  SARILAN_HUCRE,
  sayiKolonu,
  subeKoduKolonu,
  tarihAraligiMetni,
  temizAdSoyad,
} from "../rapor-utils";
import { CIKIS_DAHIL_METNI, IzinRaporOrtakProps } from "./types";

type Props = IzinRaporOrtakProps & { tarih: RaporTarihFilters };

/** Genel İzin Kullanımları */
const IzinGenelRaporu = ({
  tarih,
  IDSirket,
  IDSube,
  seciliSube,
  cikisVar,
  searchText,
  onSearchChange,
  filtre,
}: Props) => {
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "izin-raporu-kolonlar#genel",
  );

  const selectParams: IzinRaporGenelSelectRequestType = useMemo(
    () => ({
      IDSirket,
      IDSube,
      BaslangicTarihi: tarih.BaslangicTarihi,
      BitisTarihi: tarih.BitisTarihi,
      Aciklama: "0",
      CikisVar: cikisVar,
    }),
    [IDSirket, IDSube, tarih.BaslangicTarihi, tarih.BitisTarihi, cikisVar],
  );

  const {
    data: raporData = [],
    isLoading,
    isError,
    refetch,
  } = useIzinRaporGenel(selectParams);

  const filteredData = useMemo(
    () =>
      raporAra(raporData, searchText, (row) => [
        temizAdSoyad(row.AdSoyad),
        row.TcKimlikNo,
        row.SicilNo,
      ]),
    [raporData, searchText],
  );

  const tarihAraligi = tarihAraligiMetni(
    tarih.BaslangicTarihi,
    tarih.BitisTarihi,
  );
  const altBaslik = [tarihAraligi, seciliSube, cikisVar && CIKIS_DAHIL_METNI]
    .filter(Boolean)
    .join(" · ");

  const exportColumns: ExportColumn<IzinRaporGenelResponseType>[] = [
    { header: "Şube Kodu", accessorKey: "SubeKodu" },
    { header: "Sicil No", accessorKey: "SicilNo" },
    { header: "TC Kimlik No", accessorKey: "TcKimlikNo" },
    { header: "Ad Soyad", accessorKey: (row) => temizAdSoyad(row.AdSoyad) },
    { header: "Bölüm", accessorKey: "BolumAdi" },
    { header: "İzin Türü", accessorKey: "Aciklama" },
    {
      header: "Başlangıç Tarihi",
      accessorKey: (row) => isoTarihParse(row.BaslangicTarihi),
      format: "date",
    },
    {
      header: "Bitiş Tarihi",
      accessorKey: (row) => isoTarihParse(row.BitisTarihi),
      format: "date",
    },
    { header: "Gün", accessorKey: "Gun", format: "number", total: true },
    {
      header: "İşe Giriş Tarihi",
      accessorKey: (row) => isoTarihParse(row.IseSonGirisTarihi),
      format: "date",
    },
    ...(cikisVar
      ? [
          {
            header: "Çıkış Tarihi",
            accessorKey: (row: IzinRaporGenelResponseType) =>
              isoTarihParse(row.CikisTarihi),
            format: "date" as const,
          },
        ]
      : []),
  ];

  const columns: ColumnDef<IzinRaporGenelResponseType>[] = [
    subeKoduKolonu(),
    {
      accessorKey: "SicilNo",
      header: "Sicil No",
      cell: ({ row }) => row.original.SicilNo || "-",
    },
    personelKolonu(),
    {
      accessorKey: "BolumAdi",
      header: "Bölüm",
      cell: ({ row }) => row.original.BolumAdi || "-",
    },
    {
      accessorKey: "Aciklama",
      header: "İzin Türü",
      meta: SARILAN_HUCRE,
      cell: ({ row }) => row.original.Aciklama || "-",
    },
    isoTarihKolonu("BaslangicTarihi", "Başlangıç Tarihi"),
    isoTarihKolonu("BitisTarihi", "Bitiş Tarihi"),
    sayiKolonu("Gun", "Gün", { size: 80 }),
    isoTarihKolonu("IseSonGirisTarihi", "İşe Giriş Tarihi"),
    ...(cikisVar
      ? [
          isoTarihKolonu<IzinRaporGenelResponseType>(
            "CikisTarihi",
            "Çıkış Tarihi",
          ),
        ]
      : []),
  ];

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-muted-foreground text-sm sm:mr-auto">{altBaslik}</p>
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {filtre}
          <ExportMenu
            // Arama uygulanmış, ekranda görünen kayıtlar aktarılır
            data={filteredData}
            exportColumns={exportColumns}
            title="Genel İzin Kullanımları"
            subtitle={altBaslik}
            fileName={`izin-raporu-${tarih.BaslangicTarihi}-${tarih.BitisTarihi}`}
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
        getRowId={(row) => String(row.IDIzinGenel)}
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
    </>
  );
};

export default IzinGenelRaporu;
