"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "../../customs/CustomDataTable";
import { RowAction, RowActions } from "../../customs/RowActions";
import { ConfirmDialog } from "../../customs/ConfirmDialog";
import { CustomColumnVisibility } from "../../customs/CustomColumnVisibility";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ExportMenu } from "../../export/ExportMenu";
import { ExportColumn } from "../../export/types";
import { useDeleteKesinti, useKesintiList } from "@/hooks/use-bordro-parametre";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import {
  KesintiFilters,
  KesintiResponseType,
  KesintiSelectRequestType,
} from "@/types/bordro-parametre";
import { useHasRole, useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import KesintiFiltre from "./KesintiFiltre";
import KesintiEkle from "./KesintiEkle";

function getDefaultFilters(): KesintiFilters {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    Tarih1: format(yearStart, "yyyy-MM-dd"),
    Tarih2: format(now, "yyyy-MM-dd"),
    KesintiTipi: "ALL",
  };
}

type Props = {
  enabled: boolean;
};

const KesintiListesi = ({ enabled }: Props) => {
  const user = useUser();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const { data: context } = useCurrentContext();
  const { kesintiTipleri } = usePersonelSabitTanimlar();
  const deleteKesinti = useDeleteKesinti();

  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openKesintiEkle, setOpenKesintiEkle] = useState(false);
  const [duzenlenecekKesinti, setDuzenlenecekKesinti] =
    useState<KesintiResponseType | null>(null);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("kesinti-kolonlar");
  const [filters, setFilters] = useState<KesintiFilters>(getDefaultFilters);

  // Personel kendi şubesini/kaydını, admin ve yönetici seçili şubedeki
  // tüm personelleri (IDSubePersonel = 0) görür.
  const IDSube = isPersonel ? user?.IDSube : context?.IDSube;

  const selectParams: KesintiSelectRequestType = useMemo(
    () => ({
      IDSube: IDSube ?? "",
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      Tarih1: filters.Tarih1,
      Tarih2: filters.Tarih2,
    }),
    [IDSube, isPersonel, user?.IDSubePersonel, filters.Tarih1, filters.Tarih2],
  );

  const { data: kesintiListesi = [], isLoading } = useKesintiList(
    selectParams,
    enabled,
  );

  const kesintiTipiLabels = useMemo(
    () => new Map(kesintiTipleri.map((tip) => [tip.value, tip.label])),
    [kesintiTipleri],
  );

  const getKesintiTipiLabel = (row: KesintiResponseType) =>
    row.KesintiTipi2 ||
    kesintiTipiLabels.get(row.KesintiTipi) ||
    row.KesintiTipi;

  // Kesinti tipi ve ad/bölüm proc parametresi olmadığı için client-side
  // filtreleniyor.
  const filteredData = useMemo(() => {
    let data = kesintiListesi;

    if (filters.KesintiTipi !== "ALL") {
      data = data.filter(
        (kesinti) => String(kesinti.KesintiTipi) === filters.KesintiTipi,
      );
    }

    if (isPersonel) return data;

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter(
      (kesinti) =>
        kesinti.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        kesinti.BolumAdi?.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [kesintiListesi, searchText, isPersonel, filters.KesintiTipi]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteKesinti.mutate(
      { IDSubePersonelOzelKesinti: Number(silinecekId) },
      {
        onSuccess: () => {
          toast.success("Kesinti kaydı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Kesinti kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<KesintiResponseType>[] = [
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Bölüm", accessorKey: "BolumAdi" },
    {
      header: "Kesinti Tarihi",
      accessorKey: (row) => format(new Date(row.KesintiTarihi), "dd.MM.yyyy"),
    },
    { header: "Kesinti Tipi", accessorKey: getKesintiTipiLabel },
    { header: "Tutar", accessorKey: "BordroKesintiTutari" },
  ];

  const columns: ColumnDef<KesintiResponseType>[] = useMemo(() => {
    const actionColumn: ColumnDef<KesintiResponseType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi kesintilerini sadece görüntüler, düzenleyemez/silemez.
        if (isPersonel) return null;

        const actions: RowAction<KesintiResponseType>[] = [
          {
            label: "Düzenle",
            icon: Pencil,
            onClick: (r) => setDuzenlenecekKesinti(r),
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: (r) =>
              setSilinecekId(String(r.IDSubePersonelOzelKesinti)),
          },
        ];
        return (
          <div className="flex justify-end">
            <RowActions row={row.original} actions={actions} />
          </div>
        );
      },
    };

    const personelBilgiColumns: ColumnDef<KesintiResponseType>[] = [
      { accessorKey: "AdSoyad", header: "Ad Soyad" },
      { accessorKey: "BolumAdi", header: "Bölüm" },
    ];

    const ortakColumns: ColumnDef<KesintiResponseType>[] = [
      {
        accessorKey: "KesintiTarihi",
        header: "Kesinti Tarihi",
        cell: ({ row }) =>
          format(new Date(row.original.KesintiTarihi), "dd.MM.yyyy"),
      },
      {
        id: "kesintiTipi",
        header: "Kesinti Tipi",
        cell: ({ row }) => getKesintiTipiLabel(row.original),
      },
      {
        accessorKey: "BordroKesintiTutari",
        header: "Tutar",
        cell: ({ row }) =>
          Number(row.original.BordroKesintiTutari).toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
    ];

    return isPersonel
      ? [actionColumn, ...ortakColumns]
      : [actionColumn, ...personelBilgiColumns, ...ortakColumns];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonel, kesintiTipiLabels]);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {!isPersonel && (
          <div className="w-full sm:w-48 sm:shrink-0">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <KesintiFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(getDefaultFilters())}
          />

          {!isPersonel && (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenKesintiEkle(true)}
            >
              <Plus className="size-4" />
              Kesinti Ekle
            </Button>
          )}
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Kesinti Listesi"
            fileName="kesinti-listesi"
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
        title="Kesinti kaydını sil"
        description="Bu kesinti kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteKesinti.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openKesintiEkle && (
        <KesintiEkle
          open={openKesintiEkle}
          onOpenChange={setOpenKesintiEkle}
          IDSube={context?.IDSube}
        />
      )}

      {duzenlenecekKesinti && (
        <KesintiEkle
          open={Boolean(duzenlenecekKesinti)}
          onOpenChange={(open) => !open && setDuzenlenecekKesinti(null)}
          IDSube={context?.IDSube}
          kesinti={duzenlenecekKesinti}
        />
      )}
    </div>
  );
};

export default KesintiListesi;
