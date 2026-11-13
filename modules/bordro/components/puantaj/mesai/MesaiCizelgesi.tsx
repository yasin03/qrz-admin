"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { ExportMenu } from "@/components/export/ExportMenu";
import { ExportColumn } from "@/components/export/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { HAFTA_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import {
  MesaiCizelgesiSelectRequestType,
  MesaiCizelgesiSelectResponseType,
} from "@/modules/bordro/types/puantaj";
import { useMesaiCizelgesiList } from "@/modules/bordro/hooks/use-puantaj";
import MesaiCizelgesiFiltre, {
  type MesaiCizelgesiFiltreValues,
} from "./MesaiCizelgesiFiltre";
import MesaiDrawer from "./MesaiDrawer";
import {
  MESAI_TOPLAM_ALANLARI,
  formatToplam,
  mesaiParcalari,
} from "./mesai-helpers";

type Props = {
  selectParams: MesaiCizelgesiSelectRequestType;
  enabled: boolean;
};

type Row = MesaiCizelgesiSelectResponseType;

const PERSONEL_WIDTH = 220;

const GUN_WIDTH = 64;

const MesaiCizelgesi = ({ selectParams: baslangicParams, enabled }: Props) => {
  // Filtreden gelen şube/bölüm/ay seçimi; seçim yapılana kadar bağlam değerleri
  const [filtre, setFiltre] = useState<MesaiCizelgesiFiltreValues | null>(
    null,
  );
  const handleFiltre = useCallback(
    (values: MesaiCizelgesiFiltreValues) => setFiltre(values),
    [],
  );

  const initialFiltre = useMemo<MesaiCizelgesiFiltreValues>(
    () => ({
      IDSube: baslangicParams.IDSube,
      IDBolum: baslangicParams.IDBolum,
      Ay: baslangicParams.Ay,
    }),
    [baslangicParams.IDSube, baslangicParams.IDBolum, baslangicParams.Ay],
  );

  const selectParams = useMemo<MesaiCizelgesiSelectRequestType>(
    () => ({ ...baslangicParams, ...filtre }),
    [baslangicParams, filtre],
  );

  const {
    data: mesaiData = [],
    isLoading,
    isError,
  } = useMesaiCizelgesiList(
    selectParams,
    enabled && Boolean(selectParams.IDSube) && selectParams.IDSube !== "0",
  );
  const [searchText, setSearchText] = useState("");
  const [drawerId, setDrawerId] = useState<string | null>(null);

  // Drawer listeden güncel kaydı okur
  const drawerKayit = useMemo(
    () =>
      drawerId === null
        ? null
        : (mesaiData.find((m) => String(m.IDSubePersonel) === drawerId) ??
          null),
    [drawerId, mesaiData],
  );
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "puantaj-mesai-kolonlar",
  );

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("tr-TR");
    if (!query) return mesaiData;
    return mesaiData.filter(
      (m) =>
        m.Ad?.toLocaleLowerCase("tr-TR").includes(query) ||
        m.Soyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        m.AdSoyad?.toLocaleLowerCase("tr-TR").includes(query) ||
        m.SicilNo?.toLocaleLowerCase("tr-TR").includes(query) ||
        m.TcKimlikNo?.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [mesaiData, searchText]);

  const gunSayisi = useMemo(() => {
    const yil = Number(selectParams.Yil);
    const ay = Number(selectParams.Ay);
    if (!yil || !ay) return 31;
    return new Date(yil, ay, 0).getDate();
  }, [selectParams.Yil, selectParams.Ay]);

  const exportColumns: ExportColumn<Record<string, any>>[] = useMemo(
    () => [
      { header: "Sicil No", accessorKey: "SicilNo" },
      { header: "Ad Soyad", accessorKey: "AdSoyad" },
      { header: "T.C. Kimlik No", accessorKey: "TcKimlikNo" },
      { header: "Bölüm", accessorKey: "BolumAdi" },
      { header: "Ünvan", accessorKey: "UnvanAdi2" },
      { header: "İşe Giriş", accessorKey: "IseSonGirisTarihi2" },
      { header: "Çıkış", accessorKey: "CikisTarihi2" },
      ...Array.from({ length: gunSayisi }, (_, i) => ({
        header: String(i + 1),
        accessorKey: `G${i + 1}`,
      })),
      ...MESAI_TOPLAM_ALANLARI.map((t) => ({
        header: t.title,
        accessorKey: t.key as string,
      })),
    ],
    [gunSayisi],
  );

  const columns: ColumnDef<Row>[] = useMemo(() => {
    const personelColumn: ColumnDef<Row> = {
      id: "Personel",
      accessorKey: "AdSoyad",
      header: "Ad Soyad / T.C.K. No",
      size: PERSONEL_WIDTH,
      meta: {
        headerClassName:
          "sticky z-30 bg-background border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
        cellClassName:
          "sticky z-20 bg-background border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
        stickyLeft: 0,
      },
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col items-start">
          <Button
            variant="primary"
            appearance="link"
            className="cursor-pointer h-auto max-w-full justify-start px-0 py-0 leading-tight text-blue-900 underline decoration-primary/40 decoration-dotted hover:decoration-primary hover:decoration-solid"
            title="Detayları aç"
            onClick={() => setDrawerId(String(row.original.IDSubePersonel))}
          >
            <span className="truncate">{row.original.AdSoyad}</span>
          </Button>
          <span className="text-xs leading-tight text-muted-foreground tabular-nums">
            {row.original.TcKimlikNo}
          </span>
        </div>
      ),
    };

    const yil = Number(selectParams.Yil);
    const ay = Number(selectParams.Ay);

    const gunColumns: ColumnDef<Row>[] = Array.from(
      { length: gunSayisi },
      (_, i) => {
        const gunNo = i + 1;
        const key = `G${gunNo}` as keyof Row;
        const jsGun = new Date(yil, ay - 1, gunNo).getDay();
        const haftaNo = jsGun === 0 ? 7 : jsGun;
        const hafta = HAFTA_DATA.find((item) => Number(item.value) === haftaNo);
        const isWeekend = hafta?.isWeekend ?? false;

        return {
          id: key,
          accessorKey: key,
          header: () => (
            <div
              className={cn(
                "flex flex-col items-center justify-center leading-tight",
                isWeekend && "text-red-500",
              )}
            >
              <span className="font-medium">{gunNo}</span>
              <span className="text-[10px] font-normal">
                {hafta?.shortTr ?? ""}
              </span>
            </div>
          ),
          size: GUN_WIDTH,
          enableSorting: false,
          meta: {
            headerClassName: cn(
              "border-r border-border text-center",
              isWeekend && "bg-red-50 text-red-500",
            ),
            cellClassName: cn(
              "border-r border-border text-center tabular-nums",
              isWeekend && "bg-red-50/50 dark:bg-red-700/30",
            ),
          },
          // "FMS.100 3.0" → üstte kod, altta saat; ikisi aynı punto
          cell: ({ getValue }) => {
            const parcalar = mesaiParcalari(getValue<string | null>());
            if (parcalar.length === 0) return null;
            return (
              <div className="flex flex-col items-center text-[12px] leading-tight font-semibold whitespace-nowrap text-amber-700 dark:text-amber-400">
                {parcalar.map((p, idx) => (
                  <span key={idx}>{p}</span>
                ))}
              </div>
            );
          },
        };
      },
    );

    const toplamColumns: ColumnDef<Row>[] = MESAI_TOPLAM_ALANLARI.map((t) => ({
      id: t.key,
      accessorKey: t.key,
      header: () => (
        <span title={t.title} className="whitespace-nowrap">
          {t.header}
        </span>
      ),
      size: 64,
      meta: {
        headerClassName: "border-r border-border text-center bg-muted/50",
        cellClassName:
          "border-r border-border text-center tabular-nums font-semibold bg-muted/30",
      },
      cell: ({ getValue }) => formatToplam(getValue<string | null>()),
    }));

    return [personelColumn, ...gunColumns, ...toplamColumns];
  }, [gunSayisi, selectParams.Yil, selectParams.Ay]);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-48 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <MesaiCizelgesiFiltre
            initial={initialFiltre}
            onApply={handleFiltre}
          />

          <ExportMenu
            data={filteredData}
            exportColumns={exportColumns}
            title="Mesai Çizelgesi"
            fileName="mesai-cizelgesi"
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
        dense
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? "Kayıtlar yüklenirken hata oluştu."
            : "Mesai kaydı bulunamadı."
        }
      />

      <MesaiDrawer
        kayit={drawerKayit}
        onOpenChange={(open) => !open && setDrawerId(null)}
      />
    </div>
  );
};

export default MesaiCizelgesi;
