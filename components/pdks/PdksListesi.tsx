"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { usePdksList } from "@/hooks/use-pdks";
import { PDKSSelectRequestType, PDKSSelectResponseType } from "@/types/pdks";

type Props = {
  selectParams: PDKSSelectRequestType;
  enabled: boolean;
};

const PdksListesi = ({ selectParams, enabled }: Props) => {
  const {
    data: pdksData = [],
    isLoading: isPdksLoading,
    isError: isPdksError,
  } = usePdksList(selectParams, enabled);

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
  );
};

export default PdksListesi;