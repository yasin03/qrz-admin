"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Plus, Search } from "lucide-react";

import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { cn, normalize } from "@/lib/utils";
import { useCrmSatisTahsilatlari } from "@/modules/crm/hooks/use-finans";
import { useCrmSatislar } from "@/modules/crm/hooks/use-satis";
import { ODEME_DURUM, satisOdemeOzeti, type SatisOdemeOzeti } from "@/modules/crm/lib/finans";
import { KISI_TIP_ETIKET } from "@/modules/crm/lib/kisiler";
import {
  SATIS_DURUM,
  SATIS_TIPI_ETIKET,
  YENILEME_GUN_VARSAYILAN,
  abonelikMi,
  yenilemeMetni,
} from "@/modules/crm/lib/satis";
import { gunFormat, paraFormat } from "@/modules/crm/lib/teklif";
import type { CrmSatisRow, DbId } from "@/modules/crm/types/satis";

import { SatisDrawer } from "./SatisDrawer";
import { BOS_SATIS_FILTRELERI, SatisFiltre, type SatisFiltreleri } from "./SatisFiltre";
import { SatisFormDialog, type SatisFormModu } from "./SatisFormDialog";
import { SatisIslemDialog, satisSatirAksiyonlari, type SatisIslem } from "./SatisIslemDialog";

const ARANAN_ALANLAR = ["SatisNo", "KisiAdi", "Konu", "Ad", "TeklifNoTam"] as const;

/** Bitişi yaklaşan / geçmiş, henüz yenilenmemiş geçerli abonelik (SP _SELECT_Yenileme ile aynı). */
const yenilemeBekliyor = (s: CrmSatisRow) =>
  s.Durum === 0 &&
  abonelikMi(s.SatisTipi) &&
  !s.YenilendiMi &&
  s.YenilemeGunKalan != null &&
  s.YenilemeGunKalan <= YENILEME_GUN_VARSAYILAN;

/** Açık satış adreste (?satis=ID) tutulur; teklif ve kişi ekranından link ile gelinebilir. */
function useSeciliSatis() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const secili = searchParams.get("satis");

  const setSecili = useCallback(
    (id: DbId | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id == null) params.delete("satis");
      else params.set("satis", String(id));
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, searchParams],
  );

  return [secili, setSecili] as const;
}

const BOS_OZET: SatisOdemeOzeti = { TahsilEdilen: 0, Kalan: 0, OdemeDurumu: null };

/** Satışlar sekmesi: kime ne satıldı, kaça, ödeme durumu (rozet finans tarafından). */
export function SatisListesi() {
  const { data: satislar = [], isLoading, isError, refetch } = useCrmSatislar();
  const { data: tahsilatHaritasi } = useCrmSatisTahsilatlari();

  const [arama, setArama] = useState("");
  const [filters, setFilters] = useState<SatisFiltreleri>(BOS_SATIS_FILTRELERI);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility("crm-satis-kolonlar");
  const [formMod, setFormMod] = useState<SatisFormModu | null>(null);
  const [islem, setIslem] = useState<SatisIslem | null>(null);
  const [seciliID, setSeciliID] = useSeciliSatis();

  // Satış başına kalan / ödeme durumu: satış toplamı + rozet sorgusundaki net tahsilat.
  const ozetler = useMemo(
    () =>
      new Map(
        satislar.map((s) => [
          String(s.IDCrmSatis),
          satisOdemeOzeti(s, tahsilatHaritasi?.get(String(s.IDCrmSatis))),
        ]),
      ),
    [satislar, tahsilatHaritasi],
  );
  const ozet = useCallback((s: CrmSatisRow) => ozetler.get(String(s.IDCrmSatis)) ?? BOS_OZET, [ozetler]);
  const tahsilatVar = useCallback(
    (s: CrmSatisRow) => tahsilatHaritasi?.has(String(s.IDCrmSatis)) ?? false,
    [tahsilatHaritasi],
  );

  const yenilenecekSayisi = useMemo(() => satislar.filter(yenilemeBekliyor).length, [satislar]);

  const filtrelenmis = useMemo(() => {
    const q = normalize(arama.trim());
    return satislar.filter((s) => {
      if (filters.Yenileme && !yenilemeBekliyor(s)) return false;
      if (filters.Durum && String(s.Durum) !== filters.Durum) return false;
      if (filters.SatisTipi && String(s.SatisTipi) !== filters.SatisTipi) return false;
      if (filters.ParaBirimi && s.ParaBirimi !== filters.ParaBirimi) return false;
      if (filters.OdemeDurumu && String(ozet(s).OdemeDurumu) !== filters.OdemeDurumu) return false;
      if (!q) return true;
      return ARANAN_ALANLAR.some((alan) => normalize(s[alan] ?? "").includes(q));
    });
  }, [satislar, arama, filters, ozet]);

  // TL karşılığı sadece döviz satışları için anlamlı (bkz. Teklifler).
  const dovizVar = useMemo(() => satislar.some((s) => s.ParaBirimi !== "TRY"), [satislar]);

  const handleFilterChange = useCallback((next: SatisFiltreleri) => setFilters(next), []);
  const handleFilterReset = useCallback(() => setFilters(BOS_SATIS_FILTRELERI), []);

  const islemAc = useCallback(
    (tip: SatisIslem["tip"], s: CrmSatisRow) => setIslem({ tip, satis: s, tahsilEdilen: ozet(s).TahsilEdilen }),
    [ozet],
  );

  const exportColumns = useMemo<ExportColumn<CrmSatisRow>[]>(
    () => [
      { header: "Satış No", accessorKey: "SatisNo" },
      { header: "Kişi", accessorKey: "KisiAdi" },
      { header: "Konu", accessorKey: "Konu" },
      { header: "Satış Tipi", accessorKey: (s) => SATIS_TIPI_ETIKET[s.SatisTipi] },
      { header: "Satış Tarihi", accessorKey: (s) => gunFormat(s.SatisTarihi) },
      { header: "Başlangıç", accessorKey: (s) => (s.BaslangicTarihi ? gunFormat(s.BaslangicTarihi) : "") },
      { header: "Bitiş", accessorKey: (s) => (s.BitisTarihi ? gunFormat(s.BitisTarihi) : "") },
      { header: "Durum", accessorKey: (s) => SATIS_DURUM[s.Durum].label },
      { header: "Para Birimi", accessorKey: "ParaBirimi" },
      dovizVar
        ? { header: "Genel Toplam", accessorKey: "GenelToplam", format: "number" }
        : { header: "Genel Toplam", accessorKey: "GenelToplam", format: "money", total: true },
      ...(dovizVar
        ? [{ header: "TL Karşılığı", accessorKey: "GenelToplamTL", format: "money", total: true } as const]
        : []),
      { header: "Tahsil Edilen", accessorKey: (s) => ozet(s).TahsilEdilen, format: "number" },
      { header: "Kalan", accessorKey: (s) => ozet(s).Kalan, format: "number" },
      {
        header: "Ödeme",
        accessorKey: (s) => {
          const d = ozet(s).OdemeDurumu;
          return d == null ? "" : ODEME_DURUM[d].label;
        },
      },
      { header: "Teklif No", accessorKey: "TeklifNoTam" },
      { header: "Satışı Yapan", accessorKey: "Ad" },
    ],
    [dovizVar, ozet],
  );

  const columns = useMemo<ColumnDef<CrmSatisRow>[]>(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={satisSatirAksiyonlari<CrmSatisRow>({
              onGoruntule: (s) => setSeciliID(s.IDCrmSatis),
              onDuzenle: (s) => setFormMod({ tip: "duzenle", IDCrmSatis: s.IDCrmSatis }),
              onIslem: islemAc,
              tahsilatVar,
            })}
          />
        ),
      },
      {
        accessorKey: "SatisNo",
        header: "Satış No",
        cell: ({ row }) => <span className="font-medium whitespace-nowrap">{row.original.SatisNo}</span>,
      },
      {
        id: "Kisi",
        accessorFn: (s) => s.KisiAdi ?? "",
        header: "Kişi",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.KisiAdi ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{KISI_TIP_ETIKET[row.original.KisiTip]}</p>
          </div>
        ),
      },
      {
        accessorKey: "Konu",
        header: "Konu",
        cell: ({ row }) => <span className="line-clamp-2">{row.original.Konu}</span>,
      },
      {
        id: "SatisTipi",
        accessorFn: (s) => SATIS_TIPI_ETIKET[s.SatisTipi],
        header: "Tip",
        cell: ({ row }) => <span className="whitespace-nowrap">{SATIS_TIPI_ETIKET[row.original.SatisTipi]}</span>,
      },
      {
        accessorKey: "SatisTarihi",
        header: "Tarih",
        cell: ({ row }) => <span className="whitespace-nowrap">{gunFormat(row.original.SatisTarihi)}</span>,
      },
      {
        id: "Donem",
        accessorFn: (s) => s.BitisTarihi ?? "",
        header: "Dönem Bitişi",
        cell: ({ row }) => {
          const s = row.original;
          if (!abonelikMi(s.SatisTipi)) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="whitespace-nowrap">
              <p>{gunFormat(s.BitisTarihi)}</p>
              {s.YenilendiMi ? (
                <p className="text-xs text-muted-foreground">Yenilendi · {s.SonrakiSatisNo}</p>
              ) : (
                s.Durum === 0 && (
                  <p
                    className={cn(
                      "text-xs",
                      yenilemeBekliyor(s) ? "font-medium text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {yenilemeMetni(s.YenilemeGunKalan)}
                  </p>
                )
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "GenelToplam",
        header: "Genel Toplam",
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="whitespace-nowrap tabular-nums">
            <p className="font-medium">{paraFormat(row.original.GenelToplam, row.original.ParaBirimi)}</p>
            {dovizVar && row.original.ParaBirimi !== "TRY" && (
              <p className="text-xs text-muted-foreground">{paraFormat(row.original.GenelToplamTL, "TRY")}</p>
            )}
          </div>
        ),
      },
      {
        id: "Kalan",
        accessorFn: (s) => ozet(s).Kalan,
        header: "Kalan",
        meta: { align: "right" },
        cell: ({ row }) => {
          const o = ozet(row.original);
          if (row.original.Durum === 1 && o.TahsilEdilen <= 0) return <span className="text-muted-foreground">-</span>;
          return (
            <span className={cn("whitespace-nowrap tabular-nums", o.Kalan > 0 && "font-medium text-destructive")}>
              {paraFormat(o.Kalan, row.original.ParaBirimi)}
            </span>
          );
        },
      },
      {
        id: "Odeme",
        accessorFn: (s) => ozet(s).OdemeDurumu ?? -1,
        header: "Ödeme",
        cell: ({ row }) => {
          const d = ozet(row.original).OdemeDurumu;
          return d == null ? null : <Badge variant={ODEME_DURUM[d].variant}>{ODEME_DURUM[d].label}</Badge>;
        },
      },
      {
        id: "Durum",
        accessorFn: (s) => SATIS_DURUM[s.Durum].label,
        header: "Durum",
        cell: ({ row }) => {
          const d = SATIS_DURUM[row.original.Durum];
          return <Badge variant={d.variant}>{d.label}</Badge>;
        },
      },
      {
        id: "SatisiYapan",
        accessorFn: (s) => s.Ad ?? s.KullaniciAdi ?? "",
        header: "Satışı Yapan",
        cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>,
      },
    ],
    [setSeciliID, islemAc, tahsilatVar, ozet, dovizVar],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-64 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="No, kişi, konu ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SatisFiltre filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />
          <Button type="button" size="sm" onClick={() => setFormMod({ tip: "yeni" })}>
            <Plus className="size-4" />
            Yeni Satış
          </Button>
          <ExportMenu data={filtrelenmis} exportColumns={exportColumns} title="Satış Listesi" fileName="satis-listesi" />
          <div className="shrink-0">
            <CustomColumnVisibility columns={columns} value={columnVisibility} onChange={setColumnVisibility} />
          </div>
        </div>
      </div>

      {yenilenecekSayisi > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-orange-900/50 dark:bg-orange-900/20">
          <span className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <CalendarClock className="size-4 shrink-0" />
            {yenilenecekSayisi} aboneliğin dönemi {YENILEME_GUN_VARSAYILAN} gün içinde bitiyor veya bitti, henüz
            yenilenmedi.
          </span>
          <Button
            size="sm"
            appearance="outline"
            onClick={() => setFilters((f) => ({ ...f, Yenileme: !f.Yenileme }))}
          >
            {filters.Yenileme ? "Tümünü göster" : "Göster"}
          </Button>
        </div>
      )}

      <CustomDataTable
        data={filtrelenmis}
        columns={columns}
        loading={isLoading}
        getRowId={(s) => String(s.IDCrmSatis)}
        onRowClick={(s) => setSeciliID(s.IDCrmSatis)}
        pageResetKey={`${arama}|${JSON.stringify(filters)}`}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? "Satış listesi getirilemedi."
            : arama || filtrelenmis.length !== satislar.length
              ? "Arama veya filtreye uygun satış bulunamadı."
              : "Henüz satış yok."
        }
        onRetry={isError ? () => refetch() : undefined}
      />

      <SatisDrawer
        IDCrmSatis={seciliID}
        onOpenChange={(v) => !v && setSeciliID(null)}
        onDuzenle={(s) => setFormMod({ tip: "duzenle", IDCrmSatis: s.IDCrmSatis })}
        onIslem={(tip, s, tahsilEdilen) => setIslem({ tip, satis: s, tahsilEdilen })}
        onSec={(id) => setSeciliID(id)}
      />

      <SatisFormDialog
        open={!!formMod}
        onOpenChange={(v) => !v && setFormMod(null)}
        mod={formMod}
        onKaydedildi={(id) => setSeciliID(id)}
      />

      <SatisIslemDialog
        islem={islem}
        onOpenChange={(v) => !v && setIslem(null)}
        onTamamlandi={(tip, yeniID) => {
          // Yenilemede yeni dönem açılır; silinen satışın drawer'ı kapanır.
          if (tip === "yenile" && yeniID != null) setSeciliID(yeniID);
          if (tip === "sil") setSeciliID(null);
        }}
      />
    </div>
  );
}
