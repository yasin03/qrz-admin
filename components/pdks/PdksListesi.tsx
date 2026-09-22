"use client";

import { Pencil, Search, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { usePdksList } from "@/hooks/use-pdks";
import { PDKSSelectRequestType, PDKSSelectResponseType } from "@/types/pdks";
import { Input } from "../ui/input";
import { useState } from "react";
import PdksFiltre from "./PdksFiltre";
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
    Tarih1: "",
    Tarih2: "",
  });
  const {
    data: pdksData = [],
    isLoading: isPdksLoading,
    isError: isPdksError,
  } = usePdksList(
    pdksFilters,
    enabled && Boolean(pdksFilters.Tarih1 && pdksFilters.Tarih2),
  );
  const [searchText, setSearchText] = useState("");
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
    { header: "Aciklama", accessorKey: "Aciklama" },
  ];

  const columns: ColumnDef<PDKSSelectResponseType>[] = [
    {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const kayit = row.original;

        const actions: RowAction<PDKSSelectResponseType>[] = [
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
    {
      accessorKey: "Aciklama",
      header: "Aciklama",
      cell: ({ row }) => row.original.Aciklama ?? "-",
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
        data={pdksData}
        columns={columns}
        loading={isPdksLoading}
        pagination
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
