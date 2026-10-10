"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "../customs/CustomDataTable";
import { Badge } from "../ui/badge";
import { usePdksDetay } from "@/hooks/use-pdks";
import { formatDate } from "@/lib/format";
import { PDKSDetaySelectResponseType } from "@/types/pdks";

type PdksDetayProps = {
  idSubePersonelSaat: string | number;
};

export default function PdksDetay({ idSubePersonelSaat }: PdksDetayProps) {
  // Her kayıt kendi query key'i (["pdks-detay", id]) ile cache'leniyor,
  // açılan satırların detayları birbirine karışmıyor.
  const {
    data: detaylar = [],
    isLoading,
    isError,
  } = usePdksDetay(idSubePersonelSaat);

  const columns = useMemo<ColumnDef<PDKSDetaySelectResponseType>[]>(
    () => [
      {
        accessorKey: "Tarih",
        header: "Tarih",
        cell: ({ row }) => formatDate(row.original.Tarih),
      },
      {
        id: "Saat",
        header: "Saat",
        cell: ({ row }) => formatDate(row.original.Tarih, "HH:mm"),
      },
      {
        accessorKey: "Yon",
        header: "Yön",
        cell: ({ row }) => {
          const yon = row.original.Yon;
          return (
            <Badge variant={yon === "Giriş" ? "success" : "danger"}>
              {yon}
            </Badge>
          );
        },
      },
      {
        accessorKey: "LokasyonAdi",
        header: "Lokasyon",
        cell: ({ row }) => row.original.LokasyonAdi ?? "-",
      },
      {
        accessorKey: "Enlem",
        header: "Enlem",
        cell: ({ row }) => row.original.Enlem ?? "-",
      },
      {
        accessorKey: "Boylam",
        header: "Boylam",
        cell: ({ row }) => row.original.Boylam ?? "-",
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="p-4 text-center text-sm text-destructive">
        Detay kayıtları getirilemedi.
      </p>
    );
  }

  return (
    <CustomDataTable
      data={detaylar}
      columns={columns}
      pagination={false}
      emptyMessage="Detay kaydı bulunamadı."
    />
  );
}
