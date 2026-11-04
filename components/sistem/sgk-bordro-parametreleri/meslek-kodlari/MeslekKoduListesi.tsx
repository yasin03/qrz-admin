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
  useDeleteMeslekKodu,
  useMeslekKoduList,
} from "@/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { MeslekKoduFilters, MeslekKoduType } from "@/types/sistem/sgk-bordro";
import { getAnaGrup } from "./meslek-kodu-options";
import MeslekKoduFiltre from "./MeslekKoduFiltre";
import MeslekKoduEkle from "./MeslekKoduEkle";

const INITIAL_FILTERS: MeslekKoduFilters = { AnaGrup: "ALL" };

type Props = {
  enabled: boolean;
};

const MeslekKoduListesi = ({ enabled }: Props) => {
  const deleteMeslekKodu = useDeleteMeslekKodu();

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openMeslekKoduEkle, setOpenMeslekKoduEkle] = useState(false);
  const [duzenlenecekMeslekKodu, setDuzenlenecekMeslekKodu] =
    useState<MeslekKoduType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "meslek-kodu-kolonlar",
  );
  const [filters, setFilters] = useState<MeslekKoduFilters>(INITIAL_FILTERS);

  const { data: meslekKoduListesi = [], isLoading } =
    useMeslekKoduList(enabled);

  // Ana grup proc parametresi olmadığı için client-side filtreleniyor.
  // Arama kod ve açıklamada yapılıyor.
  const filteredData = useMemo(() => {
    let data = meslekKoduListesi;

    if (filters.AnaGrup !== "ALL") {
      data = data.filter((m) => getAnaGrup(m.Kod) === filters.AnaGrup);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((m) =>
      [m.Kod, m.Aciklama, m.Kod2].some((v) =>
        String(v ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(query),
      ),
    );
  }, [meslekKoduListesi, searchText, filters.AnaGrup]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteMeslekKodu.mutate(
      { IDPersonelMeslekKodu: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("Meslek kodu silinemedi");
            return;
          }
          toast.success("Meslek kodu silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Meslek kodu silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<MeslekKoduType>[] = [
    { header: "Kod", accessorKey: "Kod" },
    { header: "Açıklama", accessorKey: "Aciklama" },
  ];

  const columns: ColumnDef<MeslekKoduType>[] = useMemo(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={[
              {
                label: "Düzenle",
                icon: Pencil,
                onClick: (r) => setDuzenlenecekMeslekKodu(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(Number(r.IDPersonelMeslekKodu)),
              },
            ]}
          />
        ),
      },
      { accessorKey: "Kod", header: "Kod" },
      { accessorKey: "Aciklama", header: "Açıklama" },
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
          <MeslekKoduFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />

          <Button
            type="button"
            size="sm"
            onClick={() => setOpenMeslekKoduEkle(true)}
          >
            <Plus className="size-4" />
            Meslek Kodu Ekle
          </Button>
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Meslek Kodları"
            fileName="meslek-kodlari"
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
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <ConfirmDialog
        open={!!silinecekId}
        onOpenChange={(open) => !open && setSilinecekId(null)}
        title="Meslek kodunu sil"
        description="Bu meslek kodu kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteMeslekKodu.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openMeslekKoduEkle && (
        <MeslekKoduEkle
          open={openMeslekKoduEkle}
          onOpenChange={setOpenMeslekKoduEkle}
        />
      )}

      {duzenlenecekMeslekKodu && (
        <MeslekKoduEkle
          open={Boolean(duzenlenecekMeslekKodu)}
          onOpenChange={(open) => !open && setDuzenlenecekMeslekKodu(null)}
          meslekKodu={duzenlenecekMeslekKodu}
        />
      )}
    </div>
  );
};

export default MeslekKoduListesi;
