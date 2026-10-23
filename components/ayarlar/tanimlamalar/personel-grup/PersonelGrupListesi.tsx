"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import {
  useDeletePersonelGrup,
  usePersonelGrupList,
} from "@/hooks/use-personel-grup";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { normalize } from "@/lib/utils";
import { PersonelGrupType } from "@/types/ayarlar/personel-grup";
import PersonelGrupEkle from "./PersonelGrupEkle";

type Props = {
  enabled: boolean;
};

const PersonelGrupListesi = ({ enabled }: Props) => {
  const { data: gruplar = [], isLoading } = usePersonelGrupList(enabled);
  const deleteGrup = useDeletePersonelGrup();

  const [searchText, setSearchText] = useState("");
  const [openGrupEkle, setOpenGrupEkle] = useState(false);
  const [duzenlenecekGrup, setDuzenlenecekGrup] =
    useState<PersonelGrupType | null>(null);
  const [silinecekGrup, setSilinecekGrup] = useState<PersonelGrupType | null>(
    null,
  );
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "personel-grup-kolonlar",
  );

  const filteredData = useMemo(() => {
    const query = normalize(searchText.trim());
    if (!query) return gruplar;

    return gruplar.filter((grup) =>
      [grup.Kod, grup.Adi].some((value) =>
        normalize(String(value ?? "")).includes(query),
      ),
    );
  }, [gruplar, searchText]);

  const handleDeleteConfirm = () => {
    if (!silinecekGrup) return;

    deleteGrup.mutate(
      { IDSirketPersonelGrup: silinecekGrup.IDSirketPersonelGrup },
      {
        onSuccess: (result) => {
          if (Number(result?.test) !== 1) {
            toast.error("Personel grubu silinemedi.");
            return;
          }
          toast.success("Personel grubu silindi");
          setSilinecekGrup(null);
        },
        onError: () => {
          toast.error("Personel grubu silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<PersonelGrupType>[] = [
    { header: "Kod", accessorKey: "Kod" },
    { header: "Grup Adı", accessorKey: "Adi" },
  ];

  const columns = useMemo<ColumnDef<PersonelGrupType>[]>(
    () => [
      {
        id: "actions",
        size: 10,
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={[
              {
                label: "Düzenle",
                icon: Pencil,
                onClick: (r) => setDuzenlenecekGrup(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekGrup(r),
              },
            ]}
          />
        ),
      },
      { accessorKey: "Kod", header: "Kod" },
      {
        accessorKey: "Adi",
        header: "Grup Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.Adi}
          </span>
        ),
      },
    ],
    [],
  );

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
          <Button type="button" size="sm" onClick={() => setOpenGrupEkle(true)}>
            <Plus className="size-4" />
            Yeni Grup Ekle
          </Button>
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Personel Grupları"
            fileName="personel-gruplari"
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
        loading={isLoading}
        onRowClick={(row) => setDuzenlenecekGrup(row)}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <ConfirmDialog
        open={!!silinecekGrup}
        onOpenChange={(open) => !open && setSilinecekGrup(null)}
        title="Personel grubunu sil"
        description={`"${silinecekGrup?.Adi}" grubu kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`}
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteGrup.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <PersonelGrupEkle open={openGrupEkle} onOpenChange={setOpenGrupEkle} />

      <PersonelGrupEkle
        open={!!duzenlenecekGrup}
        onOpenChange={(open) => !open && setDuzenlenecekGrup(null)}
        grup={duzenlenecekGrup}
      />
    </div>
  );
};

export default PersonelGrupListesi;
