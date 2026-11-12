"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import {
  useDeleteIzinLimit,
  useIzinLimitList,
} from "@/modules/core/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { IzinLimitFilters, IzinLimitType } from "@/modules/core/types/sistem/sgk-bordro";
import { getNitelikLabel, toNitelikValue } from "./izin-limit-options";
import IzinLimitFiltre from "./IzinLimitFiltre";
import IzinLimitEkle from "./IzinLimitEkle";

const INITIAL_FILTERS: IzinLimitFilters = { Nitelik: "ALL" };

type Props = {
  enabled: boolean;
};

const IzinLimitListesi = ({ enabled }: Props) => {
  const deleteIzinLimit = useDeleteIzinLimit();

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openIzinLimitEkle, setOpenIzinLimitEkle] = useState(false);
  const [duzenlenecekIzinLimit, setDuzenlenecekIzinLimit] =
    useState<IzinLimitType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "izin-limit-kolonlar",
  );
  const [filters, setFilters] = useState<IzinLimitFilters>(INITIAL_FILTERS);

  const { data: izinLimitListesi = [], isLoading } = useIzinLimitList(enabled);

  // Nitelik proc parametresi olmadığı için client-side filtreleniyor.
  // Arama nitelik ve sayısal değerlerde yapılıyor.
  const filteredData = useMemo(() => {
    let data = izinLimitListesi;

    if (filters.Nitelik !== "ALL") {
      data = data.filter((l) => toNitelikValue(l.Nitelik) === filters.Nitelik);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((l) =>
      [getNitelikLabel(l.Nitelik), l.Baslangic, l.Bitis, l.Deger].some((v) =>
        String(v ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(query),
      ),
    );
  }, [izinLimitListesi, searchText, filters.Nitelik]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteIzinLimit.mutate(
      { IDPersonelIzinLimit: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("İzin limiti silinemedi");
            return;
          }
          toast.success("İzin limiti silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("İzin limiti silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<IzinLimitType>[] = [
    { header: "Nitelik", accessorKey: (row) => getNitelikLabel(row.Nitelik) },
    { header: "Başlangıç", accessorKey: "Baslangic" },
    { header: "Bitiş", accessorKey: "Bitis" },
    { header: "Değer", accessorKey: "Deger" },
  ];

  const columns: ColumnDef<IzinLimitType>[] = useMemo(
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
                onClick: (r) => setDuzenlenecekIzinLimit(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(Number(r.IDPersonelIzinLimit)),
              },
            ]}
          />
        ),
      },
      {
        accessorKey: "Nitelik",
        header: "Nitelik",
        cell: ({ row }) =>
          toNitelikValue(row.original.Nitelik) === "YAŞ" ? (
            <Badge variant="purple">
              {getNitelikLabel(row.original.Nitelik)}
            </Badge>
          ) : (
            <Badge variant="info">{getNitelikLabel(row.original.Nitelik)}</Badge>
          ),
      },
      { accessorKey: "Baslangic", header: "Başlangıç" },
      { accessorKey: "Bitis", header: "Bitiş" },
      { accessorKey: "Deger", header: "Değer" },
    ],
    [],
  );

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <IzinLimitFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />

          <Button
            type="button"
            size="sm"
            onClick={() => setOpenIzinLimitEkle(true)}
          >
            <Plus className="size-4" />
            İzin Limiti Ekle
          </Button>
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="İzin Limitleri"
            fileName="izin-limitleri"
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
        title="İzin limitini sil"
        description="Bu izin limiti kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteIzinLimit.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openIzinLimitEkle && (
        <IzinLimitEkle
          open={openIzinLimitEkle}
          onOpenChange={setOpenIzinLimitEkle}
        />
      )}

      {duzenlenecekIzinLimit && (
        <IzinLimitEkle
          open={Boolean(duzenlenecekIzinLimit)}
          onOpenChange={(open) => !open && setDuzenlenecekIzinLimit(null)}
          izinLimit={duzenlenecekIzinLimit}
        />
      )}
    </div>
  );
};

export default IzinLimitListesi;
