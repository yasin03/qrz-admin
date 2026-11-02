"use client";

import { useMemo, useState } from "react";
import { CopyPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  useAktarKatsayiOran,
  useDeleteKatsayiOran,
  useKatsayiOranList,
} from "@/hooks/sistem/use-sgk-bordro";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import {
  KatsayiOranFilters,
  KatsayiOranType,
} from "@/types/sistem/sgk-bordro";
import {
  KATSAYI_ALANLARI,
  formatKatsayiDeger,
  getAyAdi,
  toAyValue,
} from "./katsayi-oran-options";
import KatsayiOranFiltre from "./KatsayiOranFiltre";
import KatsayiOranEkle from "./KatsayiOranEkle";
import YilSecici from "../YilSecici";
import SonrakiYilaAktar from "../SonrakiYilaAktar";

const INITIAL_FILTERS: KatsayiOranFilters = { Ay: "ALL" };

type Props = {
  enabled: boolean;
};

const KatsayiOranListesi = ({ enabled }: Props) => {
  const { data: savedContext } = useCurrentContext();
  const sessionYil = String(
    savedContext?.Yil || new Date().getFullYear().toString(),
  );
  const deleteKatsayiOran = useDeleteKatsayiOran();
  const aktarKatsayiOran = useAktarKatsayiOran();

  // null → session yılı kullanılır (context sonradan gelse de doğru yıl seçilir)
  const [seciliYil, setSeciliYil] = useState<string | null>(null);
  const yil = seciliYil ?? sessionYil;

  const [silinecekId, setSilinecekId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openKatsayiOranEkle, setOpenKatsayiOranEkle] = useState(false);
  const [openAktar, setOpenAktar] = useState(false);
  const [duzenlenecekKatsayiOran, setDuzenlenecekKatsayiOran] =
    useState<KatsayiOranType | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "katsayi-oran-kolonlar",
  );
  const [filters, setFilters] = useState<KatsayiOranFilters>(INITIAL_FILTERS);

  const { data: katsayiOranListesi = [], isLoading } = useKatsayiOranList(
    yil,
    enabled,
  );

  const mevcutAylar = useMemo(
    () => katsayiOranListesi.map((k) => toAyValue(k.Ay)),
    [katsayiOranListesi],
  );

  // Ay proc parametresi olmadığı için client-side filtreleniyor.
  // Arama ay adında yapılıyor. Liste aya göre sıralı.
  const filteredData = useMemo(() => {
    let data = [...katsayiOranListesi].sort(
      (a, b) => Number(a.Ay) - Number(b.Ay),
    );

    if (filters.Ay !== "ALL") {
      data = data.filter((k) => toAyValue(k.Ay) === filters.Ay);
    }

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((k) =>
      getAyAdi(k.Ay).toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [katsayiOranListesi, searchText, filters.Ay]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteKatsayiOran.mutate(
      { IDGosterge: silinecekId },
      {
        onSuccess: (result) => {
          if (result && Number(result.test) !== 1) {
            toast.error("Katsayı silinemedi");
            return;
          }
          toast.success("Katsayı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Katsayı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<KatsayiOranType>[] = [
    { header: "Yıl", accessorKey: "Yil" },
    { header: "Ay", accessorKey: (row) => getAyAdi(row.Ay) },
    ...KATSAYI_ALANLARI.map(
      (alan): ExportColumn<KatsayiOranType> =>
        alan.tip === "money"
          ? { header: alan.label, accessorKey: alan.key, format: "money" }
          : {
              header: alan.label,
              accessorKey: (row) => formatKatsayiDeger(alan.tip, row[alan.key]),
            },
    ),
  ];

  const columns: ColumnDef<KatsayiOranType>[] = useMemo(
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
                onClick: (r) => setDuzenlenecekKatsayiOran(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setSilinecekId(Number(r.IDGosterge)),
              },
            ]}
          />
        ),
      },
      { accessorKey: "Yil", header: "Yıl" },
      {
        accessorKey: "Ay",
        header: "Ay",
        cell: ({ row }) => getAyAdi(row.original.Ay),
      },
      ...KATSAYI_ALANLARI.map(
        (alan): ColumnDef<KatsayiOranType> => ({
          accessorKey: alan.key,
          header: alan.label,
          cell: ({ row }) => formatKatsayiDeger(alan.tip, row.original[alan.key]),
        }),
      ),
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

          <KatsayiOranFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(INITIAL_FILTERS)}
          />

          <YilSecici value={yil} onChange={setSeciliYil} />
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenKatsayiOranEkle(true)}
          >
            <Plus className="size-4" />
            Katsayı Ekle
          </Button>
          <Button
            type="button"
            variant="success"
            appearance="solid"
            size="sm"
            onClick={() => setOpenAktar(true)}
          >
            <CopyPlus className="size-4" />
            Sonraki Yıla Aktar
          </Button>
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title={`Katsayı Oranları ${yil}`}
            fileName={`katsayi-oranlari-${yil}`}
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
        title="Katsayıyı sil"
        description="Bu aya ait katsayı kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteKatsayiOran.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openKatsayiOranEkle && (
        <KatsayiOranEkle
          open={openKatsayiOranEkle}
          onOpenChange={setOpenKatsayiOranEkle}
          defaultYil={yil}
          mevcutAylar={mevcutAylar}
        />
      )}

      {duzenlenecekKatsayiOran && (
        <KatsayiOranEkle
          open={Boolean(duzenlenecekKatsayiOran)}
          onOpenChange={(open) => !open && setDuzenlenecekKatsayiOran(null)}
          defaultYil={yil}
          mevcutAylar={mevcutAylar}
          katsayiOran={duzenlenecekKatsayiOran}
        />
      )}

      {openAktar && (
        <SonrakiYilaAktar
          open={openAktar}
          onOpenChange={setOpenAktar}
          mevcutYil={yil}
          onAktarildi={setSeciliYil}
          konu="Katsayılar"
          aktar={aktarKatsayiOran.mutateAsync}
          isPending={aktarKatsayiOran.isPending}
        />
      )}
    </div>
  );
};

export default KatsayiOranListesi;
