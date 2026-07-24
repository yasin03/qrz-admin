"use client";

import { useMemo, useRef, useState } from "react";
import {
  UserPlus,
  FileText,
  Merge,
  Pencil,
  Power,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useKurumsalData,
  useSirketler,
  useSubeler,
} from "@/hooks/use-kurumsal-data";
import GrupEkle from "./GrupEkle";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowAction, RowActions } from "@/components/customs/RowActions";
import { ColumnDef } from "@tanstack/react-table";
import { GrupType } from "@/types/kurumsal/grup";
import { Badge } from "@/components/ui/badge";

export default function Grup() {
  const { gruplar, isLoadingGruplar, createGrup } = useKurumsalData();
  const [openGrup, setOpenGrup] = useState(false);
  console.log("gruplar", gruplar);

  const columns = useMemo<ColumnDef<GrupType>[]>(
    () => [
      {
        id: "actions",
        size: 20,
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const grup = row.original;

          const actions: RowAction<GrupType>[] = [
            {
              label: "Düzenle",
              icon: Pencil,
              onClick: (r) => console.log("düzenle", r.IDGurup),
            },
            {
              label: grup.Durum === 1 ? "Pasif Yap" : "Aktif Yap",
              icon: Power,
              onClick: (r) => console.log("durum değiştir", r.IDGurup),
            },
            {
              label: "Sil",
              icon: Trash2,
              variant: "danger",
              separatorBefore: true,
              onClick: (r) => console.log("sil", r.IDGurup),
            },
          ];

          return (
            <div className="flex justify-end">
              <RowActions row={grup} actions={actions} />
            </div>
          );
        },
      },
      {
        accessorKey: "GrupAdi",
        header: "Grup Adı",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.GurupAdi}
          </span>
        ),
      },
      {
        accessorKey: "Tel",
        header: "Tel",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.Tel ? row.original.Tel : "-"}
          </span>
        ),
      },
      {
        accessorKey: "Durum",
        header: "Durum",
        cell: ({ row }) => {
          const status = row.original.Durum;
          console.log("status", status);
          return (
            <Badge variant={status ? "success" : "destructive"} className="w-20">

              {status ? "Aktif" : "Pasif"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "CreatedDate",
        header: "Oluşturma Tarihi",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.CreatedDate}
          </span>
        ),
      },
      {
        accessorKey: "SirketSayisi",
        header: "Şirket Sayısı",
        cell: ({ row }) => (
          <Badge >{row.original.SirketSayisi}</Badge>
        ),
      },
    ],
    [],
  );

  if (isLoadingGruplar) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={() => setOpenGrup(true)}>
            <UserPlus className="size-4" />
            Yeni Çalışan
          </Button>
        </div>
      </div>

      <CustomDataTable
        data={gruplar}
        columns={columns}
        onRowClick={(row) => console.log("satıra tıklandı", row)}
      />

      <GrupEkle open={openGrup} onOpenChange={setOpenGrup} />
    </div>
  );
}
