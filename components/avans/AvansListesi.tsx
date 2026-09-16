"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import { ConfirmDialog } from "../customs/ConfirmDialog";
import { useAvansList, useDeleteAvans } from "@/hooks/use-avans";
import { AvansFilters, AvansSelectParams, AvansType } from "@/types/avans";
import { useHasRole, useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ExportMenu } from "../export/ExportMenu";
import { ExportColumn } from "../export/types";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import AvansFiltre from "./AvansFiltre";
import AvansEkle from "./AvansEkle";

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

const AvansListesi = ({ enabled }: Props) => {
  const user = useUser();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const deleteAvans = useDeleteAvans();
  const [openAvansEkle, setOpenAvansEkle] = useState(false);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("avans-kolonlar");
  const [filters, setFilters] = useState<AvansFilters>(() => ({
    ...getDefaultDateRange(),
    Aciklama: "",
    Durum: "ALL",
  }));
  const selectParams: AvansSelectParams = useMemo(
    () => ({
      IDSube: isPersonel ? String(user?.IDSube ?? null) : null,
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      BaslangicTarihi: filters.BaslangicTarihi,
      BitisTarihi: filters.BitisTarihi,
    }),
    [isPersonel, user?.IDSubePersonel, filters],
  );
  const { data: avansListesi = [], isLoading } = useAvansList(
    selectParams,
    enabled,
  );

  // Ad/Soyad/Sicil/Şube proc parametresi olmadığı için client-side arama.
  // Personel rolünde zaten tek kişinin verisi geldiği için arama kutusu
  // hiç gösterilmiyor, dolayısıyla burada da filtre uygulanmıyor.
  const filteredData = useMemo(() => {
    let data = avansListesi;

    if (filters.Durum && filters.Durum !== "ALL") {
      data = data.filter((avans) => {
        if (filters.Durum === "REDDEDILDI") return !!avans.RedDurum;
        if (filters.Durum === "ONAYLANDI")
          return !avans.RedDurum && !!avans.OnayDurum;
        // BEKLIYOR
        return !avans.RedDurum && !avans.OnayDurum;
      });
    }

    if (isPersonel) return data;

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((avans) => {
      return (
        avans.Ad?.toLocaleLowerCase("tr-TR").includes(query) ||
        avans.Soyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        avans.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        avans.SubeAdi?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [avansListesi, searchText, isPersonel, filters.Durum]);

  const handleDeleteConfirm = () => {
    if (!silinecekId) return;

    deleteAvans.mutate(
      { IDIzinGenel: silinecekId },
      {
        onSuccess: () => {
          toast.success("Avans kaydı silindi");
          setSilinecekId(null);
        },
        onError: () => {
          toast.error("Avans kaydı silinemedi", {
            description: "Lütfen daha sonra tekrar deneyiniz.",
          });
        },
      },
    );
  };

  const exportColumns: ExportColumn<AvansType>[] = [
    { header: "Sicil No", accessorKey: "SicilNo" },
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Şube", accessorKey: "SubeAdi" },
    { header: "Ödeme Başlangıç Tarihi", accessorKey: "OdemeBaslangicTarihi" },
    { header: "Tutar", accessorKey: "Tutar" },
    { header: "Taksit Sayısı", accessorKey: "TaksitSayisi" },
    {
      header: "Durum",
      accessorKey: (row: any) =>
        row.RedDurum ? "Reddedildi" : row.OnayDurum ? "Onaylandı" : "Bekliyor",
    },
  ];

  const columns: ColumnDef<AvansType>[] = useMemo(() => {
    const actionColumn: ColumnDef<AvansType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        // Personel kendi onaylanmış avanslarını sadece görüntüler, silemez.
        if (isPersonel) return null;

        const actions: RowAction<AvansType>[] = [
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

    const personelBilgiColumns: ColumnDef<AvansType>[] = [
      { accessorKey: "SicilNo", header: "Sicil No" },
      { accessorKey: "AdSoyad", header: "Ad Soyad" },
      { accessorKey: "SubeAdi", header: "Şube" },
    ];

    const ortakColumns: ColumnDef<AvansType>[] = [
      {
        accessorKey: "OdemeBaslangicTarihi",
        header: "Ödeme Başlangıç",
        cell: ({ row }) =>
          format(new Date(row.original.OdemeBaslangicTarihi), "dd.MM.yyyy"),
      },
      {
        accessorKey: "Tutar",
        header: "Tutar",
        cell: ({ row }) => row.original.Tutar.toLocaleString("tr-TR"),
      },
      { accessorKey: "TaksitSayisi", header: "Taksit Sayısı" },
      {
        id: "durum",
        header: "Durum",
        cell: ({ row }) => {
          const { OnayDurum, RedDurum } = row.original;
          if (RedDurum) return <Badge variant="danger">Reddedildi</Badge>;
          if (OnayDurum) return <Badge variant="secondary">Onaylandı</Badge>;
          return <Badge variant="secondary">Bekliyor</Badge>;
        },
      },
    ];

    return isPersonel
      ? [actionColumn, ...ortakColumns]
      : [actionColumn, ...personelBilgiColumns, ...ortakColumns];
  }, [isPersonel]);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center justify-end gap-2">
        {!isPersonel && (
          <div className="w-48 shrink-0">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Ara..."
              className="w-48"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        )}

        <AvansFiltre
          filters={filters}
          onChange={setFilters}
          onReset={() =>
            setFilters({ ...getDefaultDateRange(), Aciklama: "", Durum: "ALL" })
          }
        />

        {!isPersonel && (
          <div>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenAvansEkle(true)}
            >
              <UserPlus className="size-4" />
              Yeni Avans Ekle
            </Button>
          </div>
        )}
        <ExportMenu
          data={filteredData}
          exportColumns={exportColumns}
          title="Avans Listesi"
          fileName="avans-listesi"
          showImport
          onImport={(rows) => {
            // rows: Record<string, unknown>[] — Excel'den okunan ham satırlar
            console.log("İçe aktarılan avans:", rows);
          }}
        />
        <CustomColumnVisibility
          columns={columns}
          value={columnVisibility}
          onChange={setColumnVisibility}
        />
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
        title="Avans kaydını sil"
        description="Bu avans kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?"
        variant="danger"
        confirmLabel="Sil"
        isLoading={deleteAvans.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {openAvansEkle && (
        <AvansEkle open={openAvansEkle} onOpenChange={setOpenAvansEkle} />
      )}
    </div>
  );
};

export default AvansListesi;
