"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "../customs/CustomDataTable";
import { CustomDateNavigator } from "../customs/CustomDateNavigator";
import PdksDetay from "./PdksDetay";
import { usePdksKendi } from "@/hooks/use-pdks";
import { PDKSKendiSelectResponseType } from "@/types/pdks";
import { format } from "date-fns";

type Props = {
  initialYil?: string | null;
  initialAy?: string | null;
};

// Personelin kendi aylık giriş/çıkış kayıtları - satıra tıklayınca detay açılır
export default function PersonelPdksListesi({ initialYil, initialAy }: Props) {
  const [yil, setYil] = useState(
    initialYil || new Date().getFullYear().toString(),
  );
  const [ay, setAy] = useState(
    (initialAy || (new Date().getMonth() + 1).toString()).padStart(2, "0"),
  );

  const {
    data: kayitlar = [],
    isLoading,
    isError,
  } = usePdksKendi({ Yil: yil, Ay: ay });

  const columns = useMemo<ColumnDef<PDKSKendiSelectResponseType>[]>(
    () => [
      {
        accessorKey: "Tarih",
        header: "Tarih",
        cell: ({ row }) => format(new Date(row.original.Tarih), "dd.MM.yyyy"),
      },
      {
        accessorKey: "Giris",
        header: "İlk Giriş",
        cell: ({ row }) => row.original.Giris ?? "-",
      },
      {
        accessorKey: "Cikis",
        header: "Son Çıkış",
        cell: ({ row }) => row.original.Cikis ?? "-",
      },
      {
        accessorKey: "NormalSure",
        header: "Normal Süre",
        cell: ({ row }) => row.original.NormalSure ?? "-",
      },
      {
        accessorKey: "MesaiSure",
        header: "Mesai Süresi",
        cell: ({ row }) => row.original.MesaiSure ?? "-",
      },
      {
        accessorKey: "IzinSure",
        header: "İzin Süresi",
        cell: ({ row }) => row.original.IzinSure ?? "-",
      },
      {
        accessorKey: "ToplamSure",
        header: "Toplam Süre",
        cell: ({ row }) => row.original.ToplamSure ?? "-",
      },
    ],
    [],
  );

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex justify-end">
        <CustomDateNavigator
          mode="month"
          value={`${yil}-${ay}`}
          onChange={(value) => {
            const [y, a] = value.split("-");
            setYil(y);
            setAy(a);
          }}
        />
      </div>

      <CustomDataTable
        data={kayitlar}
        columns={columns}
        getRowId={(row) => String(row.IDSubePersonelSaat)}
        loading={isLoading}
        // Bir ay en fazla 31 kayıt - sayfalamaya gerek yok
        pagination={false}
        expandable
        expandOnRowClick
        expandedRowContent={(row) => (
          <PdksDetay idSubePersonelSaat={row.original.IDSubePersonelSaat} />
        )}
        emptyMessage={
          isError
            ? "Kayıtlar yüklenirken hata oluştu."
            : "Bu ay için PDKS kaydı bulunamadı."
        }
      />
    </div>
  );
}
