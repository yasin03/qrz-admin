"use client";

import { useMemo, useRef, useState } from "react";
import {
  UserPlus,
  FileText,
  Merge,
  Pencil,
  Power,
  Trash2,
  Loader2,
  Plus,
  PlusCircleIcon,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, normalize } from "@/lib/utils";
import { useDeleteGrup, useKurumsalData } from "@/hooks/use-kurumsal-data";
import GrupEkle from "./GrupEkle";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowAction, RowActions } from "@/components/customs/RowActions";
import { ColumnDef } from "@tanstack/react-table";
import { GrupType } from "@/types/kurumsal/grup";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { Input } from "@/components/ui/input";
import SirketEkle from "../sirket/SirketEkle";
import Sirket from "../sirket/Sirket";

export default function Grup() {
  const { gruplar, isLoadingGruplar, createGrup } = useKurumsalData();
  const deleteGrup = useDeleteGrup();

  const [openGrup, setOpenGrup] = useState(false);
  const [openSirketEkle, setOpenSirketEkle] = useState(false);

  const [secilenGrup, setSecilenGrup] = useState<GrupType | null>(null);
  const [silinecekGrup, setSilinecekGrup] = useState<GrupType | null>(null);
  const [duzenlenecekGrup, setDuzenlenecekGrup] = useState<GrupType | null>(
    null,
  );
  const [searchText, setSearchText] = useState<string>("");

  const filteredGruplar = useMemo(() => {
    if (!searchText.trim()) return gruplar;

    const search = normalize(searchText);

    return gruplar.filter((grup) =>
      [grup.GurupAdi, grup.Tel]
        .filter(Boolean)
        .some((value) => value && normalize(value.toString()).includes(search)),
    );
  }, [gruplar, searchText]);

  const handleEdit = (grup: GrupType) => {
    setDuzenlenecekGrup(grup);
    setOpenGrup(true);
  };

  const handleEkleSirket = (grup: GrupType) => {
    setSecilenGrup(grup);
    setOpenSirketEkle(true);
  };

  const handleDeleteConfirm = () => {
    if (!silinecekGrup) return;

    deleteGrup.mutate(
      { IDGurup: silinecekGrup.IDGurup },
      {
        onSuccess: () => {
          toast.success("Grup silindi");
          setSilinecekGrup(null);
        },
        onError: (err) => {
          console.error("Grup silinemedi", err);
          toast.error("Grup silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<GrupType>[]>(
    () => [
      {
        id: "actions",
        size: 20,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const grup = row.original;

          const actions: RowAction<GrupType>[] = [
            {
              label: "Düzenle",
              icon: Pencil,
              onClick: (r) => handleEdit(r),
            },
            {
              label: "Şirket Ekle",
              icon: PlusCircleIcon,
              onClick: (r) => handleEkleSirket(r),
            },
            {
              label: grup.Durum ? "Pasif Yap" : "Aktif Yap",
              icon: Power,
              onClick: (r) => console.log("durum değiştir", r.IDGurup),
            },
            {
              label: "Sil",
              icon: Trash2,
              variant: "danger",
              separatorBefore: true,
              onClick: (r) => setSilinecekGrup(r),
            },
          ];

          return (
            <div className="flex justify-end">
              <RowActions row={grup} actions={actions} />
            </div>
          );
        },
      },
      {
        accessorKey: "GrupAdi",
        header: "Grup Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.GurupAdi}
          </span>
        ),
      },
      {
        accessorKey: "Tel",
        header: "Tel",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.Tel ? row.original.Tel : "-"}
          </span>
        ),
      },
      {
        accessorKey: "Durum",
        header: "Durum",
        cell: ({ row }) => {
          const status = row.original.Durum;
          return (
            <Badge
              variant={status ? "success" : "destructive"}
              className="w-20"
            >
              {status ? "Aktif" : "Pasif"}
            </Badge>
          );
        },
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
      {
        accessorKey: "SirketSayisi",
        header: "Şirket Sayısı",
        cell: ({ row }) => <Badge>{row.original.SirketSayisi}</Badge>,
      },
    ],
    [],
  );

  if (isLoadingGruplar) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kurumsal Yönetim</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Grup Ara..."
              className="w-48"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="button" size="sm" onClick={() => setOpenGrup(true)}>
              <Plus className="size-4" />
              Yeni Grup Ekle
            </Button>
          </div>
        </div>

        <CustomDataTable
          data={filteredGruplar}
          columns={columns}
          onRowClick={(row) => console.log("satıra tıklandı", row)}
          expandable
          expandedRowContent={(row) => (
            <Sirket idGurup={row.original.IDGurup} />
          )}
        />
      </div>
      <GrupEkle
        open={openGrup}
        onOpenChange={setOpenGrup}
        grup={duzenlenecekGrup}
      />

      <SirketEkle
        open={!!secilenGrup}
        onOpenChange={(open) => !open && setSecilenGrup(null)}
        idGurup={secilenGrup?.IDGurup ?? 0}
      />

      <ConfirmDialog
        open={!!silinecekGrup}
        onOpenChange={(open) => !open && setSilinecekGrup(null)}
        title="Grubu sil"
        description={`"${silinecekGrup?.GurupAdi}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteGrup.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
