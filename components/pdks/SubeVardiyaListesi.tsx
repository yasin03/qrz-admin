"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { useSubeVardiyaList, useDeleteSubeVardiya } from "@/hooks/use-pdks";
import { SubeVardiyaSaat } from "@/types/pdks";
import { formatDate } from "@/lib/format";

type Props = {
  enabled: boolean;
  onDuzenle: (kayit: SubeVardiyaSaat) => void;
};

const SubeVardiyaListesi = ({ enabled, onDuzenle }: Props) => {
  const [silinecekId, setSilinecekId] = useState<number | null>(null);

  const { data: vardiyaListesi = [], isLoading } = useSubeVardiyaList(enabled);
  const deleteVardiya = useDeleteSubeVardiya();

  const handleDeleteConfirm = () => {
    if (silinecekId === null) return;

    deleteVardiya.mutate(
      { IDSubeVardiyaSaat: silinecekId },
      {
        onSuccess: () => {
          toast.success("Vardiya saati silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Vardiya saati silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns: ColumnDef<SubeVardiyaSaat>[] = useMemo(
    () => [
      {
        id: "actions",
        size: 30,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const actions: RowAction<SubeVardiyaSaat>[] = [
            { label: "Düzenle", icon: Pencil, onClick: (r) => onDuzenle(r) },
            {
              label: "Sil",
              icon: Trash2,
              variant: "danger",
              onClick: (r) => setSilinecekId(r.IDSubeVardiyaSaat),
            },
          ];
          return (
            <div className="flex justify-end">
              <RowActions row={row.original} actions={actions} />
            </div>
          );
        },
      },
      { accessorKey: "VardiyaAdi", header: "Vardiya Adı" },
      {
        accessorKey: "BaslamaSaati",
        header: "Başlama",
        cell: ({ row }) => formatDate(row.original.BaslamaSaati, "HH:mm"),
      },
      {
        accessorKey: "BitisSaati",
        header: "Bitiş",
        cell: ({ row }) => formatDate(row.original.BitisSaati, "HH:mm"),
      },
      {
        accessorKey: "Gece",
        header: "Gece",
        cell: ({ row }) => (
          <Badge variant={row.original.Gece ? "danger" : "secondary"}>
            {row.original.Gece ? "Evet" : "Hayır"}
          </Badge>
        ),
      },
      { accessorKey: "HTGun", header: "Hafta Tatili" },
    ],
    [onDuzenle],
  );

  return (
    <>
      <CustomDataTable
        data={vardiyaListesi}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => String(row.IDSubeVardiyaSaat)}
        pagination
        emptyMessage="Vardiya saati kaydı bulunamadı."
      />

      <ConfirmDialog
        open={silinecekId !== null}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="Vardiya saatini sil"
        description="Bu vardiya saati kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteVardiya.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default SubeVardiyaListesi;
