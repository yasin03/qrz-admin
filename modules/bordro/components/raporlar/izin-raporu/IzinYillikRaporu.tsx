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
import { useIzinRaporYillik } from "@/modules/bordro/hooks/use-rapor";
import {
  IzinRaporYillikResponseType,
  IzinRaporYillikSelectRequestType,
} from "@/modules/bordro/types/rapor";
import {
  isoTarihGosterim,
  isoTarihKolonu,
  isoTarihParse,
  personelKolonu,
  raporAra,
  sayiKolonu,
  subeKoduKolonu,
  tarihGosterim,
  temizAdSoyad,
} from "../rapor-utils";
import { CIKIS_DAHIL_METNI, IzinRaporOrtakProps } from "./types";

type Props = IzinRaporOrtakProps & {
  yil: string;
  /** "yyyy-MM-dd" */
  bitisTarihi: string;
};

/** Yıllık Toplam İzin Kullanımları */
const IzinYillikRaporu = ({
  yil,
  bitisTarihi,
  IDSirket,
  IDSube,
  seciliSube,
  cikisVar,
  searchText,
  onSearchChange,
  filtre,
}: Props) => {
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "izin-raporu-kolonlar#yillik",
  );

  const selectParams: IzinRaporYillikSelectRequestType = useMemo(
    () => ({
      IDSirket,
      IDSube,
      Yil: yil,
      BitisTarihi: bitisTarihi,
      CikisVar: cikisVar,
    }),
    [IDSirket, IDSube, yil, bitisTarihi, cikisVar],
  );

  const {
    data: raporData = [],
    isLoading,
    isError,
    refetch,
  } = useIzinRaporYillik(selectParams);

  const filteredData = useMemo(
    () =>
      raporAra(raporData, searchText, (row) => [
        temizAdSoyad(row.AdSoyad),
        row.TcKimlikNo,
      ]),
    [raporData, searchText],
  );

  const altBaslik = [
    `Yıl: ${yil} / Bitiş: ${tarihGosterim(bitisTarihi)}`,
    seciliSube,
    cikisVar && CIKIS_DAHIL_METNI,
  ]
    .filter(Boolean)
    .join(" · ");

  const exportColumns: ExportColumn<IzinRaporYillikResponseType>[] = [
    { header: "Şube Kodu", accessorKey: "SubeKodu" },
    { header: "TC Kimlik No", accessorKey: "TcKimlikNo" },
    { header: "Ad Soyad", accessorKey: (row) => temizAdSoyad(row.AdSoyad) },
    {
      header: "Doğum Tarihi / Yaş",
      accessorKey: (row) =>
        row.DogumTarihi
          ? `${isoTarihGosterim(row.DogumTarihi)} (${row.Yas ?? "-"})`
          : "-",
    },
    {
      header: "İşe Giriş Tarihi",
      accessorKey: (row) => isoTarihParse(row.IseIlkGirisTarihi),
      format: "date",
    },
    {
      header: "İşten Çıkış Tarihi",
      accessorKey: (row) => isoTarihParse(row.CikisTarihi),
      format: "date",
    },
    { header: "Kıdem Yılı", accessorKey: "KidemYil", format: "number" },
    {
      header: "Toplam İzin Hakkı",
      accessorKey: "ToplamIzinHakki",
      format: "number",
      total: true,
    },
    {
      header: "Kullanılan İzin",
      accessorKey: "KullanilanIzin",
      format: "number",
      total: true,
    },
    {
      header: "Geçmiş Yıl Kullanılan İzin",
      accessorKey: "oKullanilanIzin",
      format: "number",
      total: true,
    },
    {
      header: "Toplam Kullanılan İzin",
      accessorKey: "ToplamKullanilanIzin",
      format: "number",
      total: true,
    },
    {
      header: "Toplam Kalan İzin",
      accessorKey: "ToplamKalanIzin",
      format: "number",
      total: true,
    },
  ];

  const columns: ColumnDef<IzinRaporYillikResponseType>[] = [
    subeKoduKolonu(),
    personelKolonu(),
    {
      id: "dogumTarihiYas",
      header: "Doğum Tarihi / Yaş",
      meta: { label: "Doğum Tarihi / Yaş" },
      // Sıralama doğum tarihine göre (ISO string)
      accessorFn: (row) => row.DogumTarihi ?? "",
      cell: ({ row }) => (
        <div>
          <div>{isoTarihGosterim(row.original.DogumTarihi)}</div>
          {row.original.Yas != null && (
            <div className="text-muted-foreground text-xs">
              {row.original.Yas} yaş
            </div>
          )}
        </div>
      ),
    },
    isoTarihKolonu("IseIlkGirisTarihi", "İşe Giriş Tarihi"),
    isoTarihKolonu("CikisTarihi", "İşten Çıkış Tarihi"),
    sayiKolonu("KidemYil", "Kıdem Yılı"),
    sayiKolonu("ToplamIzinHakki", "Toplam İzin Hakkı"),
    sayiKolonu("KullanilanIzin", "Kullanılan İzin"),
    sayiKolonu("oKullanilanIzin", "Geçmişte Kullanılan İzin Günü"),
    sayiKolonu("ToplamKullanilanIzin", "Toplam Kullanılan İzin"),
    sayiKolonu("ToplamKalanIzin", "Toplam Kalan İzin"),
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
            title="Yıllık Toplam İzin Kullanımları"
            subtitle={altBaslik}
            fileName={`yillik-izin-raporu-${yil}-${bitisTarihi}`}
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
        getRowId={(row) => String(row.IDSubePersonel)}
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

export default IzinYillikRaporu;
