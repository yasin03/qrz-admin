"use client";

import { useMemo, useState } from "react";
import { Pencil, Power, Trash2, Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

import { useBolumler, useDeleteBolum } from "@/hooks/use-kurumsal-data";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowAction, RowActions } from "@/components/customs/RowActions";
import { ColumnDef } from "@tanstack/react-table";

import { formatDate } from "@/lib/format";
import { BolumType } from "@/types/kurumsal/bolum";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalize } from "@/lib/utils";
import BolumEkle from "./BolumEkle";

type BolumProps = {
  idSube: number;
};

export default function Bolum({ idSube }: BolumProps) {
  const {
    data: bolumler = [],
    isLoading: isLoadingSubeler,
    isError: isErrorSubeler,
  } = useBolumler(idSube);
  const deleteBolum = useDeleteBolum();
  const [silinecekBolum, setSilinecekBolum] = useState<BolumType | null>(null);
  const [openBolumEkle, setOpenBolumEkle] = useState(false);
  const [duzenlenecekBolum, setDuzenlenecekBolum] = useState<BolumType | null>(
    null,
  );
  const [searchText, setSearchText] = useState<string>("");

  const filteredBolumler = useMemo(() => {
    if (!searchText.trim()) return bolumler;

    const search = normalize(searchText);

    return bolumler.filter((bolum) =>
      [bolum.BolumAdi]
        .filter(Boolean)
        .some((value) => value && normalize(value.toString()).includes(search)),
    );
  }, [bolumler, searchText]);

  const handleDeleteConfirm = () => {
    if (!silinecekBolum) return;

    deleteBolum.mutate(
      { IDBolum: silinecekBolum.IDBolum, IDSube: silinecekBolum.IDSube },
      {
        onSuccess: () => {
          toast.success("Bölüm silindi");
          setSilinecekBolum(null);
        },
        onError: () => {
          toast.error("Bölüm silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<BolumType>[]>(
    () => [
      {
        id: "actions",
        size: 20,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const sube = row.original;

          const actions: RowAction<BolumType>[] = [
            {
              label: "Düzenle",
              icon: Pencil,
              onClick: (r) => setDuzenlenecekBolum(r),
            },
            {
              label: "Sil",
              icon: Trash2,
              variant: "danger",
              separatorBefore: true,
              onClick: (r) => setSilinecekBolum(r),
            },
          ];

          return (
            <div
              className="flex justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <RowActions row={sube} actions={actions} />
            </div>
          );
        },
      },
      {
        accessorKey: "BolumAdi",
        header: "Bölüm Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.BolumAdi}
          </span>
        ),
      },
      {
        accessorKey: "CreatedDate",
        header: "Oluşturma Tarihi",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {formatDate(row.original.CreatedDate)}
          </span>
        ),
      },
    ],
    [],
  );

  if (isLoadingSubeler) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (isErrorSubeler) {
    return (
      <p className="p-4 text-center text-sm text-destructive">
        Şubeler getirilemedi.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"></h1>
        </div>

        <div className="flex justify-end gap-2">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Bölüm Ara..."
            className="w-48"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenBolumEkle(true)}
          >
            <Plus className="size-4" />
            Yeni Bölüm Ekle
          </Button>
        </div>
      </div>

      <CustomDataTable
        data={filteredBolumler}
        columns={columns}
        onRowClick={(row) => setDuzenlenecekBolum(row)}
        pagination={false}
      />

      <BolumEkle
        open={openBolumEkle}
        onOpenChange={setOpenBolumEkle}
        idSube={idSube}
      />

      <BolumEkle
        open={!!duzenlenecekBolum}
        onOpenChange={(open) => !open && setDuzenlenecekBolum(null)}
        idSube={idSube}
        bolum={duzenlenecekBolum}
      />

      <ConfirmDialog
        open={!!silinecekBolum}
        onOpenChange={(open) => !open && setSilinecekBolum(null)}
        title="Bölümü sil"
        description={`"${silinecekBolum?.BolumAdi}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteBolum.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
