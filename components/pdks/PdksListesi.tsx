"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { useIzinList, useDeleteIzin } from "@/hooks/use-izin";
import { IzinSelectParams, IzinType } from "@/types/izin";

const PdksListesi = () => {
  const columns: ColumnDef<IzinType>[] = useMemo(() => {
    const actionColumn: ColumnDef<IzinType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi onaylanmış izinlerini sadece görüntüler, silemez.

        const actions: RowAction<IzinType>[] = [
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: (r) => console.log(r.IDIzinGenel),
          },
        ];
        return (
          <div className="flex justify-end">
            <RowActions row={row.original} actions={actions} />
          </div>
        );
      },
    };

    const personelBilgiColumns: ColumnDef<IzinType>[] = [
      { accessorKey: "SicilNo", header: "Sicil No" },
      {
        id: "adSoyad",
        header: "Ad Soyad",
        cell: ({ row }) => `${row.original.Ad} ${row.original.Soyad}`,
      },
      { accessorKey: "BolumAdi", header: "Bölüm" },
    ];

    const ortakColumns: ColumnDef<IzinType>[] = [
      {
        accessorKey: "BaslangicTarihi",
        header: "Başlangıç",
        cell: ({ row }) =>
          format(new Date(row.original.BaslangicTarihi), "dd.MM.yyyy"),
      },
      {
        accessorKey: "BitisTarihi",
        header: "Bitiş",
        cell: ({ row }) =>
          format(new Date(row.original.BitisTarihi), "dd.MM.yyyy"),
      },
      { accessorKey: "Gun", header: "Gün" },
      {
        accessorKey: "Aciklama",
        header: "İzin Tipi",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.Aciklama}</Badge>
        ),
      },
    ];

    return [actionColumn, ...personelBilgiColumns, ...ortakColumns];
  }, []);

  return (
    <>
    
      <CustomDataTable
        data={[]}
        columns={columns}
        loading={false}
        pagination
        emptyMessage="Pdks kaydı bulunamadı."
      />

      {/*       <ConfirmDialog
        open={false}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="İzin kaydını sil"
        description="Bu izin kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteIzin.isPending}
        onConfirm={handleDeleteConfirm}
      /> */}
    </>
  );
};

export default PdksListesi;
