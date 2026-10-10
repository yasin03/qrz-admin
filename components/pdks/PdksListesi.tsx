"use client";

import { Eye, EyeOff, Pencil, Search, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { usePdksList } from "@/hooks/use-pdks";
import { PDKSSelectRequestType, PDKSSelectResponseType } from "@/types/pdks";
import { Input } from "../ui/input";
import { useMemo, useState } from "react";
import { normalize } from "@/lib/utils";
import PdksFiltre from "./PdksFiltre";
import PdksDetay from "./PdksDetay";
import { ExportMenu } from "../export/ExportMenu";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";
import { ExportColumn } from "../export/types";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

type Props = {
  enabled: boolean;
};

const PdksListesi = ({ enabled }: Props) => {
  const [pdksFilters, setPdksFilters] = useState<PDKSSelectRequestType>({
    IDSube: "0",
    IDBolum: "0",
    Tarih: "",
  });
  const {
    data: pdksData = [],
    isLoading: isPdksLoading,
    isError: isPdksError,
  } = usePdksList(
    pdksFilters,
    enabled && Boolean(pdksFilters.Tarih),
  );
  const [searchText, setSearchText] = useState("");

  const filteredPdksData = useMemo(() => {
    if (!searchText.trim()) return pdksData;

    const search = normalize(searchText);

    return pdksData.filter((kayit) =>
      [
        kayit.AdSoyad,
        kayit.Tarih,
        kayit.Giris,
        kayit.Cikis,
      ].some((value) => value && normalize(String(value)).includes(search)),
    );
  }, [pdksData, searchText]);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("pdks-kolonlar");
    
  const exportColumns: ExportColumn<PDKSSelectResponseType>[] = [
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Tarih", accessorKey: "Tarih" },
    { header: "Giriş", accessorKey: "Giris" },
    { header: "Çıkış", accessorKey: "Cikis" },
    { header: "NormalSure", accessorKey: "NormalSure" },
    { header: "MesaiSure", accessorKey: "MesaiSure" },
    { header: "IzinSure", accessorKey: "IzinSure" },
    { header: "ToplamSure", accessorKey: "ToplamSure" },
  ];

  const columns: ColumnDef<PDKSSelectResponseType>[] = [
    {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row, table }) => {
        const kayit = row.original;
        // CustomDataTable expand state'ine meta üzerinden erişiliyor
        const meta = table.options.meta as
          | {
              expandedRows?: Record<string, boolean>;
              toggleRowExpanded?: (id: string) => void;
            }
          | undefined;
        const isExpanded = Boolean(meta?.expandedRows?.[row.id]);

        const actions: RowAction<PDKSSelectResponseType>[] = [
          {
            label: isExpanded ? "Detayı Gizle" : "Detay Göster",
            icon: isExpanded ? EyeOff : Eye,
            onClick: () => meta?.toggleRowExpanded?.(row.id),
          },
          {
            label: "Düzenle",
            icon: Pencil,
            onClick: (r) => console.log(r),
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            separatorBefore: true,
            onClick: (r) => console.log(r),
          },
        ];

        return (
          <div className="flex justify-end">
            <RowActions row={kayit} actions={actions} />
          </div>
        );
      },
    },
    { accessorKey: "AdSoyad", header: "Ad Soyad" },
    { accessorKey: "Tarih", header: "Tarih" },
    {
      accessorKey: "Giris",
      header: "Giris",
      cell: ({ row }) => row.original.Giris ?? "-",
    },
    {
      accessorKey: "Cikis",
      header: "Cikis",
      cell: ({ row }) => row.original.Cikis ?? "-",
    },
    {
      accessorKey: "NormalSure",
      header: "NormalSure",
      cell: ({ row }) => row.original.NormalSure ?? "-",
    },
    {
      accessorKey: "MesaiSure",
      header: "MesaiSure",
      cell: ({ row }) => row.original.MesaiSure ?? "-",
    },
    {
      accessorKey: "IzinSure",
      header: "IzinSure",
      cell: ({ row }) => row.original.IzinSure ?? "-",
    },
    {
      accessorKey: "ToplamSure",
      header: "ToplamSure",
      cell: ({ row }) => row.original.ToplamSure ?? "-",
    },
  ];

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PdksFiltre onApply={setPdksFilters} />
          <ExportMenu
            data={pdksData}
            exportColumns={exportColumns}
            title="İzin Listesi"
            fileName="izin-listesi"
            showImport
            onImport={(rows) => {
              // rows: Record<string, unknown>[] — Excel'den okunan ham satırlar
              // burada kendi doğrulama + toplu ekleme API çağrını yapabilirsin
              console.log("İçe aktarılan izin:", rows);
            }}
          />
          <CustomColumnVisibility
            columns={columns}
            value={columnVisibility}
            onChange={setColumnVisibility}
          />
        </div>
      </div>
      <CustomDataTable
        data={filteredPdksData}
        columns={columns}
        getRowId={(row) => String(row.IDSubePersonelSaat)}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        loading={isPdksLoading}
        pagination
        expandable
        expandOnRowClick
        expandedRowContent={(row) => (
          <PdksDetay idSubePersonelSaat={row.original.IDSubePersonelSaat} />
        )}
        emptyMessage={
          isPdksError
            ? "Kayıtlar yüklenirken hata oluştu."
            : "Pdks kaydı bulunamadı."
        }
      />
    </div>
  );
};

export default PdksListesi;
