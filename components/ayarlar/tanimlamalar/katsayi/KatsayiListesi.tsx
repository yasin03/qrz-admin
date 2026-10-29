"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Pencil, Search, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import { useKatsayiList } from "@/hooks/use-katsayi";
import { useCurrentContext } from "@/hooks/use-context";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { formatMoney } from "@/lib/format";
import { normalize } from "@/lib/utils";
import { KatsayiFilters, KatsayiType } from "@/types/ayarlar/katsayi";
import KatsayiDuzenle from "./KatsayiDuzenle";
import KatsayiFiltre from "./KatsayiFiltre";

type Props = {
  enabled: boolean;
};

const ACTIONS_WIDTH = 50;
const ACIKLAMA_WIDTH = 220;

const INITIAL_FILTERS: KatsayiFilters = { Yil: null, Tipi: "" };

const toBool = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

const BoolCell = ({ value }: { value: unknown }) =>
  toBool(value) ? (
    <Badge variant="success" className="p-1" title="Evet" aria-label="Evet">
      <Check className="size-4" strokeWidth={2.5} />
    </Badge>
  ) : (
    <Badge variant="danger" className="p-1" title="Hayır" aria-label="Hayır">
      <X className="size-4" strokeWidth={2.5} />
    </Badge>
  );

const evetHayir = (value: unknown) => (toBool(value) ? "Evet" : "Hayır");

const KatsayiListesi = ({ enabled }: Props) => {
  const { data: savedContext } = useCurrentContext();
  const sessionYil = String(
    savedContext?.Yil || new Date().getFullYear().toString(),
  );

  const [filters, setFilters] = useState<KatsayiFilters>(INITIAL_FILTERS);
  const yil = filters.Yil ?? sessionYil;

  const { data: katsayilar = [], isLoading } = useKatsayiList(yil, enabled);

  const [searchText, setSearchText] = useState("");
  const [duzenlenecekKatsayi, setDuzenlenecekKatsayi] =
    useState<KatsayiType | null>(null);
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility("katsayi-kolonlar");

  const tipiOptions = useMemo(
    () =>
      Array.from(new Set(katsayilar.map((k) => k.Tipi).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "tr-TR"),
      ),
    [katsayilar],
  );

  const filteredData = useMemo(() => {
    const query = normalize(searchText.trim());

    return katsayilar.filter((katsayi) => {
      const tipiOk = !filters.Tipi || katsayi.Tipi === filters.Tipi;
      if (!tipiOk) return false;
      if (!query) return true;

      return [
        katsayi.SahaAciklama,
        katsayi.Tipi,
        katsayi.OdemeSekli,
        katsayi.NetBrut,
      ].some((value) => normalize(String(value ?? "")).includes(query));
    });
  }, [katsayilar, searchText, filters.Tipi]);

  const handleFilterChange = useCallback(
    (next: KatsayiFilters) => setFilters(next),
    [],
  );
  const handleFilterReset = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const exportColumns: ExportColumn<KatsayiType>[] = [
    {
      header: "Açıklama",
      accessorKey: "SahaAciklama",
     
    },
    { header: "Tipi", accessorKey: "Tipi" },
    { header: "Ödeme Şekli", accessorKey: "OdemeSekli" },
    { header: "Net/Brüt", accessorKey: "NetBrut" },
    { header: "Katsayı", accessorKey: "Katsayi" },
    { header: "Minimum Değer", accessorKey: "MinimumDeger", format: "money" },
    { header: "Maksimum Değer", accessorKey: "MaksimumDeger", format: "money" },
    { header: "SSK Muafiyeti", accessorKey: "SskMuafiyeti", format: "money" },
    {
      header: "Vergi Muafiyeti",
      accessorKey: "VergiMuafiyeti",
      format: "money",
    },
    { header: "SGK", accessorKey: (r) => evetHayir(r.SgkUygulamaDurum) },
    { header: "Vergi", accessorKey: (r) => evetHayir(r.VergiUygulamaDurum) },
    { header: "Damga", accessorKey: (r) => evetHayir(r.DamgaUygulamaDurum) },
    { header: "Sendikalı", accessorKey: (r) => evetHayir(r.SendikaliOdeme) },
    {
      header: "Sendikasız",
      accessorKey: (r) => evetHayir(r.SendikasizOdeme),
    },
  ];

  const columns = useMemo<ColumnDef<KatsayiType>[]>(
    () => [
      {
        id: "actions",
        size: ACTIONS_WIDTH,
        header: "",
        enableSorting: false,
        enableHiding: false,
        meta: {
          stickyLeft: 0,
          headerClassName: "sticky z-40 bg-background border-r border-border",
          cellClassName: "sticky z-30 bg-background border-r border-border",
        },
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={[
              {
                label: "Düzenle",
                icon: Pencil,
                onClick: (r) => setDuzenlenecekKatsayi(r),
              },
            ]}
          />
        ),
      },
      {
        accessorKey: "SahaAciklama",
        header: "Açıklama",
        size: ACIKLAMA_WIDTH,
        enableHiding: false,
        meta: {
          stickyLeft: ACTIONS_WIDTH,
          headerClassName:
            "sticky z-40 bg-background border-r border-border shadow-[5px_0_8px_-6px_rgba(0,0,0,0.35)]",
          cellClassName:
            "sticky z-30 bg-background border-r border-border shadow-[5px_0_8px_-6px_rgba(0,0,0,0.35)]",
        },
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.SahaAciklama}
          </span>
        ),
      },
      { accessorKey: "Tipi", header: "Tipi" },
      { accessorKey: "OdemeSekli", header: "Ödeme Şekli" },
      { accessorKey: "NetBrut", header: "Net/Brüt" },
      {
        accessorKey: "Katsayi",
        header: "Katsayı",
        cell: ({ row }) => formatMoney(row.original.Katsayi),
      },
      {
        accessorKey: "MinimumDeger",
        header: "Min. Değer",
        cell: ({ row }) => formatMoney(row.original.MinimumDeger),
      },
      {
        accessorKey: "MaksimumDeger",
        header: "Maks. Değer",
        cell: ({ row }) => formatMoney(row.original.MaksimumDeger),
      },
      {
        accessorKey: "SskMuafiyeti",
        header: "SSK Muaf.",
        cell: ({ row }) => formatMoney(row.original.SskMuafiyeti),
      },
      {
        accessorKey: "VergiMuafiyeti",
        header: "Vergi Muaf.",
        cell: ({ row }) => formatMoney(row.original.VergiMuafiyeti),
      },
      {
        accessorKey: "SgkUygulamaDurum",
        header: "SGK",
        cell: ({ row }) => <BoolCell value={row.original.SgkUygulamaDurum} />,
      },
      {
        accessorKey: "VergiUygulamaDurum",
        header: "Vergi",
        cell: ({ row }) => <BoolCell value={row.original.VergiUygulamaDurum} />,
      },
      {
        accessorKey: "DamgaUygulamaDurum",
        header: "Damga",
        cell: ({ row }) => <BoolCell value={row.original.DamgaUygulamaDurum} />,
      },
      {
        accessorKey: "SendikaliOdeme",
        header: "Sendikalı",
        cell: ({ row }) => <BoolCell value={row.original.SendikaliOdeme} />,
      },
      {
        accessorKey: "SendikasizOdeme",
        header: "Sendikasız",
        cell: ({ row }) => <BoolCell value={row.original.SendikasizOdeme} />,
      },
    ],
    [],
  );

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="h-4 w-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <KatsayiFiltre
            filters={filters}
            defaultYil={sessionYil}
            tipiOptions={tipiOptions}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
          />
          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title={`Katsayılar (${yil})`}
            fileName={`katsayilar-${yil}`}
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
        onRowClick={(row) => setDuzenlenecekKatsayi(row)}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
      />

      <KatsayiDuzenle
        open={!!duzenlenecekKatsayi}
        onOpenChange={(open) => !open && setDuzenlenecekKatsayi(null)}
        katsayi={duzenlenecekKatsayi}
      />
    </div>
  );
};

export default KatsayiListesi;
