"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../../customs/CustomDataTable";
import { RowAction, RowActions } from "../../customs/RowActions";
import { ConfirmDialog } from "../../customs/ConfirmDialog";
import { CustomColumnVisibility } from "../../customs/CustomColumnVisibility";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ExportMenu } from "../../export/ExportMenu";
import { ExportColumn } from "../../export/types";
import { useDeleteEklenti, useEklentiList } from "@/hooks/use-bordro-parametre";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import {
  EklentiFilters,
  EklentiResponseType,
  EklentiSelectRequestType,
} from "@/types/bordro-parametre";
import { useHasRole, useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import EklentiFiltre from "./EklentiFiltre";
import EklentiEkle from "./EklentiEkle";

function getDefaultFilters(): EklentiFilters {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    Tarih1: format(yearStart, "yyyy-MM-dd"),
    Tarih2: format(now, "yyyy-MM-dd"),
    OdemeTipi: "ALL",
    Net: "ALL",
  };
}

type Props = {
  enabled: boolean;
};

const EklentiListesi = ({ enabled }: Props) => {
  const user = useUser();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const { data: context } = useCurrentContext();
  const { eklentiTipleri } = usePersonelSabitTanimlar();
  const deleteEklenti = useDeleteEklenti();

  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openEklentiEkle, setOpenEklentiEkle] = useState(false);
  const [duzenlenecekEklenti, setDuzenlenecekEklenti] =
    useState<EklentiResponseType | null>(null);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("eklenti-kolonlar");
  const [filters, setFilters] = useState<EklentiFilters>(getDefaultFilters);

  // Personel kendi şubesini/kaydını, admin ve yönetici seçili şubedeki
  // tüm personelleri (IDSubePersonel = 0) görür.
  const IDSube = isPersonel ? user?.IDSube : context?.IDSube;

  const selectParams: EklentiSelectRequestType = useMemo(
    () => ({
      IDSube: IDSube ?? "",
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      Tarih1: filters.Tarih1,
      Tarih2: filters.Tarih2,
    }),
    [IDSube, isPersonel, user?.IDSubePersonel, filters.Tarih1, filters.Tarih2],
  );

  const { data: eklentiListesi = [], isLoading } = useEklentiList(
    selectParams,
    enabled,
  );

  const eklentiTipiLabels = useMemo(
    () => new Map(eklentiTipleri.map((tip) => [tip.value, tip.label])),
    [eklentiTipleri],
  );

  const getEklentiTipiLabel = (row: EklentiResponseType) =>
    row.OdemeTipi2 || eklentiTipiLabels.get(row.OdemeTipi) || row.OdemeTipi;

  // Eklenti tipi, net/brüt ve ad/bölüm proc parametresi olmadığı için
  // client-side filtreleniyor.
  const filteredData = useMemo(() => {
    let data = eklentiListesi;

    if (filters.OdemeTipi !== "ALL") {
      data = data.filter(
        (eklenti) => String(eklenti.OdemeTipi) === filters.OdemeTipi,
      );
    }

    if (filters.Net !== "ALL") {
      const isNet = filters.Net === "NET";
      data = data.filter((eklenti) => Boolean(eklenti.Net) === isNet);
    }

    if (isPersonel) return data;

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter(
      (eklenti) =>
        eklenti.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        eklenti.BolumAdi?.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [eklentiListesi, searchText, isPersonel, filters.OdemeTipi, filters.Net]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteEklenti.mutate(
      { IDSubePersonelYardim: Number(silinecekId) },
      {
        onSuccess: () => {
          toast.success("Eklenti kaydı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Eklenti kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<EklentiResponseType>[] = [
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Bölüm", accessorKey: "BolumAdi" },
    {
      header: "Ödeme Tarihi",
      accessorKey: (row) => format(new Date(row.OdemeTarihi), "dd.MM.yyyy"),
    },
    { header: "Eklenti Tipi", accessorKey: getEklentiTipiLabel },
    { header: "Tutar", accessorKey: "BordroOdemeTutari" },
    {
      header: "Net / Brüt",
      accessorKey: (row) => (row.Net ? "Net" : "Brüt"),
    },
  ];

  const columns: ColumnDef<EklentiResponseType>[] = useMemo(() => {
    const actionColumn: ColumnDef<EklentiResponseType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi eklentilerini sadece görüntüler, silemez.
        if (isPersonel) return null;

        const actions: RowAction<EklentiResponseType>[] = [
          {
            label: "Düzenle",
            icon: Pencil,
            onClick: (r) => setDuzenlenecekEklenti(r),
          },
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: (r) => setSilinecekId(String(r.IDSubePersonelYardim)),
          },
        ];
        return (
          <div className="flex justify-end">
            <RowActions row={row.original} actions={actions} />
          </div>
        );
      },
    };

    const personelBilgiColumns: ColumnDef<EklentiResponseType>[] = [
      { accessorKey: "AdSoyad", header: "Ad Soyad" },
      { accessorKey: "BolumAdi", header: "Bölüm" },
    ];

    const ortakColumns: ColumnDef<EklentiResponseType>[] = [
      {
        accessorKey: "OdemeTarihi",
        header: "Ödeme Tarihi",
        cell: ({ row }) =>
          format(new Date(row.original.OdemeTarihi), "dd.MM.yyyy"),
      },
      {
        id: "eklentiTipi",
        header: "Eklenti Tipi",
        cell: ({ row }) => getEklentiTipiLabel(row.original),
      },
      {
        accessorKey: "BordroOdemeTutari",
        header: "Tutar",
        cell: ({ row }) =>
          Number(row.original.BordroOdemeTutari).toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      {
        id: "net",
        header: "Net / Brüt",
        cell: ({ row }) =>
          row.original.Net ? (
            <Badge variant="info">Net</Badge>
          ) : (
            <Badge variant="warning">Brüt</Badge>
          ),
      },
    ];

    return isPersonel
      ? [actionColumn, ...ortakColumns]
      : [actionColumn, ...personelBilgiColumns, ...ortakColumns];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonel, eklentiTipiLabels]);

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
          <EklentiFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(getDefaultFilters())}
          />

          {!isPersonel && (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenEklentiEkle(true)}
            >
              <Plus className="size-4" />
              Eklenti Ekle
            </Button>
          )}
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Eklenti Listesi"
            fileName="eklenti-listesi"
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
        title="Eklenti kaydını sil"
        description="Bu eklenti kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteEklenti.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openEklentiEkle && (
        <EklentiEkle
          open={openEklentiEkle}
          onOpenChange={setOpenEklentiEkle}
          IDSube={context?.IDSube}
        />
      )}

      {duzenlenecekEklenti && (
        <EklentiEkle
          open={Boolean(duzenlenecekEklenti)}
          onOpenChange={(open) => !open && setDuzenlenecekEklenti(null)}
          IDSube={context?.IDSube}
          eklenti={duzenlenecekEklenti}
        />
      )}
    </div>
  );
};

export default EklentiListesi;
