"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  FileSearch,
  Info,
  Search,
  UserPlus,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { CustomDataTable } from "../customs/CustomDataTable";
import { RowAction, RowActions } from "../customs/RowActions";
import TalepDetayDialog from "./TalepDetayDialog";
import { formatDate, formatMoney } from "@/lib/format";
import { useHasRole, useUser } from "@/stores/auth-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { KULLANICI_TIPI } from "@/lib/roles";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useCurrentContext } from "@/hooks/use-context";
import TalepEkle from "./TalepEkle";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { ExportMenu } from "../export/ExportMenu";
import { CustomColumnVisibility } from "../customs/CustomColumnVisibility";
import { ExportColumn } from "../export/types";
import { AvansFilters, AvansTalepType } from "@/types/avans";
import { useTalepList } from "@/hooks/use-avans";
import AvansFiltre from "./AvansFiltre";

function getDurumInfo(talep: AvansTalepType): {
  label: string;
  variant: "secondary" | "success" | "danger";
} {
  if (talep.RedDurum) return { label: "Reddedildi", variant: "danger" };
  if (talep.OnayDurum) return { label: "Onaylandı", variant: "success" };
  return { label: "Beklemede", variant: "secondary" };
}
function getDefaultDateRange() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return {
    BaslangicTarihi: formatDate(yearStart, "yyyy-MM-dd"),
    BitisTarihi: formatDate(now, "yyyy-MM-dd"),
  };
}
function getYearBounds() {
  const year = new Date().getFullYear();
  return {
    BaslangicTarihi: `${year}-01-01`,
    BitisTarihi: `${year}-12-31`,
  };
}

type Props = {
  enabled: boolean;
};

const TalepListesi = ({ enabled }: Props) => {
  const user = useUser();
  const isPersonel = useHasRole(KULLANICI_TIPI.PERSONEL);
  const { data: savedContext, isLoading: isLoadingContext } =
    useCurrentContext();
  const [detayTalep, setDetayTalep] = useState<AvansTalepType | null>(null);
  const [searchText, setSearchText] = useState("");
  const [openTalepEkle, setOpenTalepEkle] = useState(false);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "avans-talep-kolonlar",
  );
  const [filters, setFilters] = useState<AvansFilters>(() => ({
    ...getDefaultDateRange(),
    Aciklama: "",
    Durum: "ALL",
  }));
  const selectParams = useMemo(
    () => ({
      IDSube: isPersonel ? "0" : String(savedContext?.IDSube ?? "0"),
      IDSubePersonel: isPersonel ? String(user?.IDSubePersonel ?? "0") : "0",
      ...getYearBounds(),
    }),
    [isPersonel, user?.IDSube, user?.IDSubePersonel, savedContext?.IDSube],
  );
  const { data: talepListesi = [], isLoading } = useTalepList(
    selectParams,
    enabled,
  );

  const filteredTalepListesi = useMemo(() => {
    let data = talepListesi;

    if (filters.Durum && filters.Durum !== "ALL") {
      data = data.filter((talep) => {
        if (filters.Durum === "REDDEDILDI") return !!talep.RedDurum;
        if (filters.Durum === "ONAYLANDI")
          return !talep.RedDurum && !!talep.OnayDurum;
        // BEKLIYOR
        return !talep.RedDurum && !talep.OnayDurum;
      });
    }

    if (isPersonel) return data;

    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return data;

    return data.filter((talep) => {
      return (
        talep.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        talep.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        talep.SubeAdi?.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [talepListesi, searchText, isPersonel, filters.Durum]);

  const exportColumns: ExportColumn<AvansTalepType>[] = [
    { header: "Sicil No", accessorKey: "SicilNo" },
    { header: "Ad Soyad", accessorKey: "AdSoyad" },
    { header: "Şube", accessorKey: "SubeAdi" },
    { header: "Talep Tarihi", accessorKey: (row) => formatDate(row.Tarih) },
    { header: "Mesaj", accessorKey: "Mesaj" },
    {
      header: "Onay Durumu",
      accessorKey: (row) => (row.OnayDurum ? "Onaylandı" : "Bekliyor"),
    },
    {
      header: "Red Durumu",
      accessorKey: (row) => (row.RedDurum ? "Reddedildi" : "-"),
    },
    { header: "Red Açıklaması", accessorKey: "RedAciklama" },
  ];

  const columns: ColumnDef<AvansTalepType>[] = useMemo(() => {
    // Sadece admin/yönetici talebi onaylayıp reddedebilir.
    const actionColumn: ColumnDef<AvansTalepType> = {
      id: "actions",
      size: 50,
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const actions: RowAction<AvansTalepType>[] = [
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

    const personelBilgiColumns: ColumnDef<AvansTalepType>[] = [
      { accessorKey: "SicilNo", header: "Sicil No" },
      { accessorKey: "AdSoyad", header: "Ad Soyad" },
      { accessorKey: "SubeAdi", header: "Şube" },
    ];

    const ortakColumns: ColumnDef<AvansTalepType>[] = [
      {
        accessorKey: "OdemeBaslangicTarihi",
        header: "Ödeme Baslangıç Tarihi",
        cell: ({ row }) => formatDate(row.original.OdemeBaslangicTarihi),
      },
      {
        accessorKey: "Tutar",
        header: "Tutar",
        cell: ({ row }) => `${formatMoney(row.original.Tutar)} ₺`,
      },
      {
        accessorKey: "TaksitSayisi",
        header: "TaksitSayisi",
        cell: ({ row }) => `${row.original.TaksitSayisi}`,
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
      {
        accessorKey: "Mesaj",
        header: "Mesaj",
        cell: ({ row }) => `${row.original.Mesaj}`,
      },
    ];

    // Personel kendi talebini onaylayamaz/reddedemez, action kolonu yok.
    return isPersonel
      ? ortakColumns
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
          <AvansFiltre
            filters={filters}
            onChange={setFilters}
            onReset={() =>
              setFilters({
                ...getDefaultDateRange(),
                Aciklama: "",
                Durum: "ALL",
              })
            }
          />

          {isPersonel && (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpenTalepEkle(true)}
            >
              <UserPlus className="size-4" />
              Talep Ekle
            </Button>
          )}
          <ExportMenu
            data={filteredTalepListesi}
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
        data={filteredTalepListesi}
        columns={columns}
        loading={isLoading}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <TalepDetayDialog
        open={!!detayTalep}
        onOpenChange={(open) => !open && setDetayTalep(null)}
        talep={detayTalep}
        currentUser={user}
      />
      {openTalepEkle && (
        <TalepEkle
          open={openTalepEkle}
          onOpenChange={setOpenTalepEkle}
          user={user}
        />
      )}
    </div>
  );
};

export default TalepListesi;
