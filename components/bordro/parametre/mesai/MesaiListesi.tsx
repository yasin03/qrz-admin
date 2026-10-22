"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
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
import { useDeleteMesai, useMesaiList } from "@/hooks/use-bordro-parametre";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useCurrentContext } from "@/hooks/use-context";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import {
  MesaiFilters,
  MesaiResponseType,
  MesaiSelectRequestType,
} from "@/types/bordro-parametre";
import { useHasRole, useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import MesaiFiltre from "./MesaiFiltre";
import MesaiEkle from "./MesaiEkle";
import { getMesaiBirim, toMesaiTipiOptions } from "./mesai-utils";

function getDefaultFilters(): MesaiFilters {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    Tarih1: format(yearStart, "yyyy-MM-dd"),
    Tarih2: format(now, "yyyy-MM-dd"),
    MesaiTipi: "ALL",
    Net: "ALL",
  };
}

const formatMoney = (value: unknown) =>
  Number(value ?? 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type Props = {
  enabled: boolean;
};

const MesaiListesi = ({ enabled }: Props) => {
  const user = useUser();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const { data: context } = useCurrentContext();
  const { mesaiTipleri } = usePersonelSabitTanimlar();
  const deleteMesai = useDeleteMesai();

  // Silinecek kayıt id'leri; tekli silmede tek id, toplu silmede seçilenler.
  const [silinecekIdler, setSilinecekIdler] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<MesaiResponseType[]>([]);
  // CustomDataTable seçimi dışarıdan sıfırlanamıyor; silme sonrası tabloyu
  // yeniden mount ederek seçimi temizliyoruz.
  const [tableKey, setTableKey] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [openMesaiEkle, setOpenMesaiEkle] = useState(false);
  const [duzenlenecekMesai, setDuzenlenecekMesai] =
    useState<MesaiResponseType | null>(null);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("mesai-kolonlar");
  const [filters, setFilters] = useState<MesaiFilters>(getDefaultFilters);

  // Personel kendi kaydını, admin ve yönetici seçili şubedeki tüm
  // personelleri (IDSubePersonel = 0) görür.
  const IDSube = isPersonel ? user?.IDSube : context?.IDSube;

  // Mesai tipi proc parametresi olduğu için server-side filtreleniyor
  // ("0" → tümü); Net/Brüt ve ad/bölüm client-side.
  const selectParams: MesaiSelectRequestType = useMemo(
    () => ({
      IDSube: IDSube ?? "",
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      Tarih1: filters.Tarih1,
      Tarih2: filters.Tarih2,
      MesaiTipi: filters.MesaiTipi === "ALL" ? "0" : filters.MesaiTipi,
    }),
    [
      IDSube,
      isPersonel,
      user?.IDSubePersonel,
      filters.Tarih1,
      filters.Tarih2,
      filters.MesaiTipi,
    ],
  );

  const { data: mesaiListesi = [], isLoading } = useMesaiList(
    selectParams,
    enabled,
  );

  const mesaiTipiLabels = useMemo(
    () =>
      new Map(
        toMesaiTipiOptions(mesaiTipleri).map((tip) => [tip.value, tip.label]),
      ),
    [mesaiTipleri],
  );

  const getMesaiTipiLabel = (row: MesaiResponseType) =>
    row.MesaiTipi2 ||
    mesaiTipiLabels.get(String(row.MesaiTipi)) ||
    row.MesaiTipi;

  /** Gün/Brüt → "1 Gün", Saat/Brüt → "X Saat", Net → tutar */
  const getMiktarText = (row: MesaiResponseType) => {
    const birim = getMesaiBirim(getMesaiTipiLabel(row));
    if (row.Net) return formatMoney(row.Deger);
    return birim === "GUN" ? `${row.Deger} Gün` : `${row.Deger} Saat`;
  };

  const filteredData = useMemo(() => {
    let data = mesaiListesi;

    if (filters.Net !== "ALL") {
      const isNet = filters.Net === "NET";
      data = data.filter((mesai) => Boolean(mesai.Net) === isNet);
    }

    if (isPersonel) return data;

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter(
      (mesai) =>
        mesai.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        mesai.BolumAdi?.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [mesaiListesi, searchText, isPersonel, filters.Net]);

  const handleDeleteConfirm = () => {
    if (silinecekIdler.length === 0) return;

    // Toplu silmede id'ler aralarına "-" konarak gidiyor: "12-15-18"
    deleteMesai.mutate(
      { IDSubePersonelMesai: silinecekIdler.join("-") },
      {
        onSuccess: () => {
          toast.success(
            silinecekIdler.length > 1
              ? `${silinecekIdler.length} mesai kaydı silindi`
              : "Mesai kaydı silindi",
          );
          setSilinecekIdler([]);
          setSelectedRows([]);
          setTableKey((key) => key + 1);
        },
        onError: () => {
          toast.error("Mesai kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<MesaiResponseType>[] = [
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Bölüm", accessorKey: "BolumAdi" },
    {
      header: "Tarih",
      accessorKey: (row) => format(new Date(row.Tarih), "dd.MM.yyyy"),
    },
    { header: "Mesai Tipi", accessorKey: getMesaiTipiLabel },
    { header: "Gün / Saat / Tutar", accessorKey: getMiktarText },
    {
      header: "Net / Brüt",
      accessorKey: (row) => (row.Net ? "Net" : "Brüt"),
    },
  ];

  const columns: ColumnDef<MesaiResponseType>[] = useMemo(() => {
    const actionColumn: ColumnDef<MesaiResponseType> = {
      id: "actions",
      size: 50,
      // Başlık menüsü: seçilen kayıtları toplu siler
      header: () =>
        isPersonel ? null : (
          <RowActions<MesaiResponseType>
            triggerLabel="Toplu işlemler"
            actions={[
              {
                label: `Seçilenleri Sil (${selectedRows.length})`,
                icon: Trash2,
                variant: "danger",
                disabled: selectedRows.length === 0,
                onClick: () =>
                  setSilinecekIdler(
                    selectedRows.map((r) => String(r.IDSubePersonelMesai)),
                  ),
              },
            ]}
          />
        ),
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi mesailerini sadece görüntüler, düzenleyemez/silemez.
        if (isPersonel) return null;

        return (
          <RowActions
            row={row.original}
            actions={[
              {
                label: "Düzenle",
                icon: Pencil,
                onClick: (r) => setDuzenlenecekMesai(r),
              },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) =>
                  setSilinecekIdler([String(r.IDSubePersonelMesai)]),
              },
            ]}
          />
        );
      },
    };

    const personelBilgiColumns: ColumnDef<MesaiResponseType>[] = [
      { accessorKey: "AdSoyad", header: "Ad Soyad" },
      { accessorKey: "BolumAdi", header: "Bölüm" },
    ];

    const ortakColumns: ColumnDef<MesaiResponseType>[] = [
      {
        accessorKey: "Tarih",
        header: "Tarih",
        cell: ({ row }) => format(new Date(row.original.Tarih), "dd.MM.yyyy"),
      },
      {
        id: "mesaiTipi",
        header: "Mesai Tipi",
        cell: ({ row }) => getMesaiTipiLabel(row.original),
      },
      {
        id: "miktar",
        header: "Gün / Saat / Tutar",
        cell: ({ row }) => getMiktarText(row.original),
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
  }, [isPersonel, mesaiTipiLabels, selectedRows]);

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
          <MesaiFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(getDefaultFilters())}
          />

          {!isPersonel && (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenMesaiEkle(true)}
            >
              <Plus className="size-4" />
              Mesai Ekle
            </Button>
          )}
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Mesai Listesi"
            fileName="mesai-listesi"
          />
          <CustomColumnVisibility
            columns={columns}
            value={columnVisibility}
            onChange={setColumnVisibility}
          />
        </div>
      </div>

      <CustomDataTable
        key={tableKey}
        data={filteredData}
        columns={columns}
        getRowId={(row) => String(row.IDSubePersonelMesai)}
        selectableRows={!isPersonel}
        onSelectedRowsChange={({ selectedRows }) =>
          setSelectedRows(selectedRows)
        }
        loading={isLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <ConfirmDialog
        open={silinecekIdler.length > 0}
        onOpenChange={(open) => !open && setSilinecekIdler([])}
        title={
          silinecekIdler.length > 1
            ? "Seçilen mesai kayıtlarını sil"
            : "Mesai kaydını sil"
        }
        description={
          silinecekIdler.length > 1
            ? `Seçilen ${silinecekIdler.length} mesai kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?`
            : "Bu mesai kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        }
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteMesai.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openMesaiEkle && (
        <MesaiEkle
          open={openMesaiEkle}
          onOpenChange={setOpenMesaiEkle}
          IDSube={context?.IDSube}
        />
      )}

      {duzenlenecekMesai && (
        <MesaiEkle
          open={Boolean(duzenlenecekMesai)}
          onOpenChange={(open) => !open && setDuzenlenecekMesai(null)}
          IDSube={context?.IDSube}
          mesai={duzenlenecekMesai}
        />
      )}
    </div>
  );
};

export default MesaiListesi;
