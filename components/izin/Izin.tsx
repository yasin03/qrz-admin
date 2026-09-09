"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, UserPlus, Trash2, HatGlasses } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import IzinFiltre from "@/components/izin/IzinFiltre";
import IzinEkle from "@/components/izin/IzinEkle";
import { useIzinList, useDeleteIzin } from "@/hooks/use-izin";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { useUser } from "@/stores/auth-store";
import { KULLANICI_TIPI } from "@/lib/roles";
import { IzinFilters, IzinType } from "@/types/izin";
import { RowAction, RowActions } from "../customs/RowActions";
import { CustomDataTable } from "../customs/CustomDataTable";
import { ConfirmDialog } from "../customs/ConfirmDialog";

function getDefaultDateRange() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    BaslangicTarihi: format(yearStart, "yyyy-MM-dd"),
    BitisTarihi: format(now, "yyyy-MM-dd"),
  };
}

const IzinPage = () => {
  const user = useUser();
  const isPersonel = user?.IDKullaniciTip === KULLANICI_TIPI.PERSONEL;

  const { izinTipleri } = usePersonelSabitTanimlar();

  const [filters, setFilters] = useState<IzinFilters>(() => ({
    ...getDefaultDateRange(),
    Aciklama: "0",
  }));
  const [searchText, setSearchText] = useState("");
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [openIzinEkle, setOpenIzinEkle] = useState(false);

  const selectParams = useMemo(
    () => ({
      IDSube: user?.IDSube,
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      BaslangicTarihi: filters.BaslangicTarihi,
      BitisTarihi: filters.BitisTarihi,
      Aciklama: filters.Aciklama,
    }),
    [isPersonel, user?.IDSubePersonel, filters],
  );

  const {
    data: izinListesi = [],
    isLoading,
    refetch,
  } = useIzinList(selectParams, Boolean(user));

  const deleteIzin = useDeleteIzin();

  // Ad/Soyad/Sicil/Bölüm proc parametresi olmadığı için client-side arama.
  // Personel rolünde zaten tek kişinin verisi geldiği için arama kutusunu
  // hiç göstermiyoruz.
  const filteredIzinListesi = useMemo(() => {
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
          refetch();
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

  const columns: ColumnDef<IzinType>[] = useMemo(() => {
    const actionColumn: ColumnDef<IzinType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">İzin Yönetimi</h1>

        <div className="flex items-center gap-2">
          {!isPersonel && (
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Ara..."
              className="w-48"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          )}

          <IzinFiltre
            filters={filters}
            izinTipleri={izinTipleri}
            onChange={setFilters}
            onReset={() =>
              setFilters({ ...getDefaultDateRange(), Aciklama: "" })
            }
          />
          {isPersonel ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenIzinEkle(true)}
            >
              <HatGlasses className="size-4" />
              İzin Taleplerim
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenIzinEkle(true)}
            >
              <UserPlus className="size-4" />
              Yeni İzin Ekle
            </Button>
          )}
        </div>
      </div>

      <CustomDataTable
        data={filteredIzinListesi}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.IDIzinGenel}
        pagination
        emptyMessage="İzin kaydı bulunamadı."
      />

      {openIzinEkle && (
        <IzinEkle
          open={openIzinEkle}
          onOpenChange={setOpenIzinEkle}
          onSuccess={() => refetch()}
        />
      )}

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
    </div>
  );
};

export default IzinPage;
