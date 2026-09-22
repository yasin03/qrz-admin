"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Balloon, Search, SmilePlusIcon, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { useIzinList, useDeleteIzin } from "@/hooks/use-izin";
import { IzinFilters, IzinSelectParams, IzinType } from "@/types/izin";
import { useHasRole, useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { Input } from "../ui/input";
import IzinFiltre from "./IzinFiltre";
import { Button } from "../ui/button";
import IzinEkle from "./IzinEkle";
import { ExportMenu } from "../export/ExportMenu";
import { ExportColumn } from "../export/types";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

function getDefaultDateRange() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    BaslangicTarihi: format(yearStart, "yyyy-MM-dd"),
    BitisTarihi: format(now, "yyyy-MM-dd"),
  };
}

type Props = {
  enabled: boolean;
};

const IzinListesi = ({ enabled }: Props) => {
  const user = useUser();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const deleteIzin = useDeleteIzin();
  const [openIzinEkle, setOpenIzinEkle] = useState(false);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("izin-kolonlar");
  const [filters, setFilters] = useState<IzinFilters>(() => ({
    ...getDefaultDateRange(),
    Aciklama: "",
  }));
  const selectParams: IzinSelectParams = useMemo(
    () => ({
      IDSube: isPersonel ? String(user?.IDSube ?? null) : null,
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      BaslangicTarihi: filters.BaslangicTarihi,
      BitisTarihi: filters.BitisTarihi,
      Aciklama: filters.Aciklama,
    }),
    [isPersonel, user?.IDSubePersonel, filters],
  );
  const { data: izinListesi = [], isLoading } = useIzinList(
    selectParams,
    enabled,
  );

  // Ad/Soyad/Sicil/Bölüm proc parametresi olmadığı için client-side arama.
  // Personel rolünde zaten tek kişinin verisi geldiği için arama kutusu
  // hiç gösterilmiyor, dolayısıyla burada da filtre uygulanmıyor.
  const filteredData = useMemo(() => {
    if (isPersonel) return izinListesi;
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return izinListesi;

    return izinListesi.filter((izin) => {
      return (
        izin.Ad?.toLocaleLowerCase("tr-TR").includes(query) ||
        izin.Soyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        izin.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        izin.BolumAdi?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [izinListesi, searchText, isPersonel]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteIzin.mutate(
      { IDIzinGenel: silinecekId },
      {
        onSuccess: () => {
          toast.success("İzin kaydı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("İzin kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<IzinType>[] = [
    { header: "Sicil No", accessorKey: "SicilNo" },
    { header: "Ad", accessorKey: "Ad" },
    { header: "Soyad", accessorKey: "Soyad" },
    { header: "Bölüm", accessorKey: "BolumAdi" },
    { header: "Başlangıç Tarihi", accessorKey: "BaslangicTarihi" },
    { header: "Bitiş Tarihi", accessorKey: "BitisTarihi" },
    { header: "Gün", accessorKey: "Gun" },
    { header: "Açıklama", accessorKey: "Aciklama" },
    { header: "Ait Olduğu Yıl", accessorKey: "AitOlduguYil" },
    {
      header: "Durum",
      accessorKey: (row: any) => (row.Durum ? "Aktif" : "Pasif"),
    },
  ];

  const columns: ColumnDef<IzinType>[] = useMemo(() => {
    const actionColumn: ColumnDef<IzinType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi onaylanmış izinlerini sadece görüntüler, silemez.
        if (isPersonel) return null;

        const actions: RowAction<IzinType>[] = [
          {
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: (r) => setSilinecekId(r.IDIzinGenel),
          },
        ];
        return (
          <div className="flex justify-end">
            <RowActions row={row.original} actions={actions} />
          </div>
        );
      },
    };

    const personelBilgiColumns: ColumnDef<IzinType>[] = [
      { accessorKey: "SicilNo", header: "Sicil No" },
      {
        id: "adSoyad",
        header: "Ad Soyad",
        cell: ({ row }) => `${row.original.Ad} ${row.original.Soyad}`,
      },
      { accessorKey: "BolumAdi", header: "Bölüm" },
    ];

    const ortakColumns: ColumnDef<IzinType>[] = [
      {
        accessorKey: "BaslangicTarihi",
        header: "Başlangıç",
        cell: ({ row }) =>
          format(new Date(row.original.BaslangicTarihi), "dd.MM.yyyy"),
      },
      {
        accessorKey: "BitisTarihi",
        header: "Bitiş",
        cell: ({ row }) =>
          format(new Date(row.original.BitisTarihi), "dd.MM.yyyy"),
      },
      { accessorKey: "Gun", header: "Gün" },
      {
        accessorKey: "Aciklama",
        header: "İzin Tipi",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.Aciklama}</Badge>
        ),
      },
    ];

    return isPersonel
      ? [actionColumn, ...ortakColumns]
      : [actionColumn, ...personelBilgiColumns, ...ortakColumns];
  }, [isPersonel]);

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
          <IzinFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() =>
              setFilters({ ...getDefaultDateRange(), Aciklama: "" })
            }
          />

          {!isPersonel && (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenIzinEkle(true)}
            >
              <SmilePlusIcon className="size-4" />
              Yeni İzin Ekle
            </Button>
          )}
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="İzin Listesi"
            fileName="izin-listesi"
            showImport
            onImport={(rows) => {
              // rows: Record<string, unknown>[] — Excel'den okunan ham satırlar
              // burada kendi doğrulama + toplu ekleme API çağrını yapabilirsin
              console.log("İçe aktarılan izin:", rows);
            }}
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
        title="İzin kaydını sil"
        description="Bu izin kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteIzin.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openIzinEkle && (
        <IzinEkle open={openIzinEkle} onOpenChange={setOpenIzinEkle} />
      )}
    </div>
  );
};

export default IzinListesi;
