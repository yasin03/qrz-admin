"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, FileSearch, Info } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import TalepDetayDialog from "./TalepDetayDialog";
import { useTalepList } from "@/hooks/use-izin";
import { IzinTalepSelectParams, IzinTalepType } from "@/types/izin";
import { formatDate } from "@/lib/format";
import { useUser } from "@/stores/auth-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
  isPersonel: boolean;
  searchText: string;
  selectParams: IzinTalepSelectParams;
};

function getDurumInfo(talep: IzinTalepType): {
  label: string;
  variant: "secondary" | "success" | "danger";
} {
  if (talep.RedDurum) return { label: "Reddedildi", variant: "danger" };
  if (talep.OnayDurum) return { label: "Onaylandı", variant: "success" };
  return { label: "Beklemede", variant: "secondary" };
}

const TalepListesi = ({ isPersonel, searchText, selectParams }: Props) => {
  const currentUser = useUser();
  const { data: talepListesi = [], isLoading } = useTalepList(selectParams);
  const [detayTalep, setDetayTalep] = useState<IzinTalepType | null>(null);

  const filteredTalepListesi = useMemo(() => {
    if (isPersonel) return talepListesi;
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return talepListesi;

    return talepListesi.filter((talep) => {
      return (
        talep.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        talep.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        talep.SubeAdi?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [talepListesi, searchText, isPersonel]);

  const columns: ColumnDef<IzinTalepType>[] = useMemo(() => {
    // Sadece admin/yönetici talebi onaylayıp reddedebilir.
    const actionColumn: ColumnDef<IzinTalepType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const actions: RowAction<IzinTalepType>[] = [
          {
            label: "Talep Detayları",
            icon: FileSearch,
            onClick: (r) => setDetayTalep(r),
          },
        ];
        return (
          <div className="flex justify-end">
            <RowActions row={row.original} actions={actions} />
          </div>
        );
      },
    };

    const personelBilgiColumns: ColumnDef<IzinTalepType>[] = [
      { accessorKey: "SicilNo", header: "Sicil No" },
      { accessorKey: "AdSoyad", header: "Ad Soyad" },
      { accessorKey: "SubeAdi", header: "Şube" },
    ];

    const ortakColumns: ColumnDef<IzinTalepType>[] = [
      {
        accessorKey: "BaslangicTarihi",
        header: "Başlangıç",
        cell: ({ row }) => formatDate(row.original.BaslangicTarihi),
      },
      {
        accessorKey: "BitisTarihi",
        header: "Bitiş",
        cell: ({ row }) => formatDate(row.original.BitisTarihi),
      },
      { accessorKey: "Gun", header: "Gün" },
      {
        accessorKey: "Aciklama",
        header: "İzin Tipi",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.Aciklama}</Badge>
        ),
      },
      {
        id: "durum",
        header: "Durum",
        cell: ({ row }) => {
          const { label, variant } = getDurumInfo(row.original);
          const redAciklama = row.original.RedAciklama;

          return (
            <div className="flex items-center gap-1.5">
              <Badge variant={variant}>{label}</Badge>

              {row.original.RedDurum && redAciklama && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Red açıklamasını göster"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    <p className="text-sm">{redAciklama}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ];

    // Personel kendi talebini onaylayamaz/reddedemez, action kolonu yok.
    return isPersonel
      ? ortakColumns
      : [actionColumn, ...personelBilgiColumns, ...ortakColumns];
  }, [isPersonel]);

  return (
    <>
      <CustomDataTable
        data={filteredTalepListesi}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.IDSubePersonelIzinTalep}
        pagination
        emptyMessage="Talep bulunamadı."
      />

      <TalepDetayDialog
        open={!!detayTalep}
        onOpenChange={(open) => !open && setDetayTalep(null)}
        talep={detayTalep}
        currentUser={currentUser}
      />
    </>
  );
};

export default TalepListesi;
