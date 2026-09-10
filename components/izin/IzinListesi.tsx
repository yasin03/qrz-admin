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

type Props = {
  selectParams: IzinSelectParams;
  isPersonel: boolean;
  searchText: string;
  enabled: boolean;
};

const IzinListesi = ({
  selectParams,
  isPersonel,
  searchText,
  enabled,
}: Props) => {
  const [silinecekId, setSilinecekId] = useState<string | null>(null);

  const { data: izinListesi = [], isLoading } = useIzinList(
    selectParams,
    enabled,
  );
  const deleteIzin = useDeleteIzin();

  // Ad/Soyad/Sicil/Bölüm proc parametresi olmadığı için client-side arama.
  // Personel rolünde zaten tek kişinin verisi geldiği için arama kutusu
  // hiç gösterilmiyor, dolayısıyla burada da filtre uygulanmıyor.
  const filteredData = useMemo(() => {
    if (isPersonel) return izinListesi;
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return izinListesi;

    return izinListesi.filter((izin) => {
      return (
        izin.Ad?.toLocaleLowerCase("tr-TR").includes(query) ||
        izin.Soyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        izin.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        izin.BolumAdi?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [izinListesi, searchText, isPersonel]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteIzin.mutate(
      { IDIzinGenel: silinecekId },
      {
        onSuccess: () => {
          toast.success("İzin kaydı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("İzin kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns: ColumnDef<IzinType>[] = useMemo(() => {
    const actionColumn: ColumnDef<IzinType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi onaylanmış izinlerini sadece görüntüler, silemez.
        if (isPersonel) return null;

        const actions: RowAction<IzinType>[] = [
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: (r) => setSilinecekId(r.IDIzinGenel),
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

    return isPersonel
      ? [actionColumn, ...ortakColumns]
      : [actionColumn, ...personelBilgiColumns, ...ortakColumns];
  }, [isPersonel]);

  return (
    <>
      <CustomDataTable
        data={filteredData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.IDIzinGenel}
        pagination
        emptyMessage="İzin kaydı bulunamadı."
      />

      <ConfirmDialog
        open={!!silinecekId}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="İzin kaydını sil"
        description="Bu izin kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteIzin.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default IzinListesi;