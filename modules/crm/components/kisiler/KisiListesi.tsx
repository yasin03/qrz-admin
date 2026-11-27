"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarPlus,
  FilePlus2,
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/customs/ConfirmDialog";
import { CustomColumnVisibility } from "@/components/customs/CustomColumnVisibility";
import { CustomDataTable } from "@/components/customs/CustomDataTable";
import { RowActions } from "@/components/customs/RowActions";
import { ExportMenu } from "@/components/export/ExportMenu";
import type { ExportColumn } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { formatDate } from "@/lib/format";
import { cn, normalize } from "@/lib/utils";
import { parseYerel } from "@/modules/core/lib/ajanda";
import {
  AktiviteFormDialog,
  type AktiviteFormModu,
} from "@/modules/crm/components/aktivite/AktiviteFormDialog";
import {
  TeklifFormDialog,
  type TeklifFormModu,
} from "@/modules/crm/components/teklifler/TeklifFormDialog";
import {
  useCrmKisiler,
  useDeleteCrmKisi,
  useIlAdi,
  useMusteriyeDonustur,
} from "@/modules/crm/hooks/use-kisiler";
import {
  KISI_TIP_ETIKET,
  KISI_TURU_SECENEKLERI,
  kaynakEtiket,
  kisiAdi,
} from "@/modules/crm/lib/kisiler";
import type { CrmKisiRow, CrmKisiTip } from "@/modules/crm/types/kisiler";

import { KisiDrawer } from "./KisiDrawer";
import {
  BOS_KISI_FILTRELERI,
  KAYNAK_BOS,
  KisiFiltre,
  type KisiFiltreleri,
} from "./KisiFiltre";
import { KisiFormDialog } from "./KisiFormDialog";

type Props = {
  tip: CrmKisiTip;
};

type Onay = { tip: "sil" | "donustur"; kisi: CrmKisiRow };

const ARANAN_ALANLAR = [
  "Kurum",
  "YetkiliKisi",
  "CepTelefon",
  "YetkiliKisiTel",
  "YetkiliKisiEPostaAdresi",
] as const;

const kisiTuruEtiket = (k: CrmKisiRow) =>
  KISI_TURU_SECENEKLERI.find((s) => s.value === String(k.KisiTuru))?.label ??
  "";

/** Bekleyen randevusu var ve zamanı geçmiş. */
const randevuGecikmis = (k: CrmKisiRow, simdi: Date) => {
  const t = parseYerel(k.SiradakiRandevuTarihi);
  return t != null && t < simdi;
};

export function KisiListesi({ tip }: Props) {
  const {
    data: kisiler = [],
    isLoading,
    isError,
    refetch,
  } = useCrmKisiler(tip);
  const sil = useDeleteCrmKisi();
  const donustur = useMusteriyeDonustur();
  const ilAdi = useIlAdi();

  const [arama, setArama] = useState("");
  const [filters, setFilters] = useState<KisiFiltreleri>(BOS_KISI_FILTRELERI);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    `crm-${tip.toLowerCase()}-kolonlar`,
  );
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<CrmKisiRow | null>(null);
  const [aktiviteMod, setAktiviteMod] = useState<AktiviteFormModu | null>(null);
  const [teklifMod, setTeklifMod] = useState<TeklifFormModu | null>(null);
  const [onay, setOnay] = useState<Onay | null>(null);
  // Drawer ID ile tutulur; liste tazelenince güncel kayıt gösterilir.
  const [seciliID, setSeciliID] = useState<string | null>(null);

  const etiket = KISI_TIP_ETIKET[tip];
  const musteri = tip === "Musteri";
  const secili = useMemo(
    () => kisiler.find((k) => String(k.IDCrmKisi) === seciliID) ?? null,
    [kisiler, seciliID],
  );

  const filtrelenmis = useMemo(() => {
    const q = normalize(arama.trim());
    const simdi = new Date();
    return kisiler.filter((k) => {
      if (filters.Durum !== null && k.Durum !== filters.Durum) return false;
      if (filters.KisiTuru !== null && k.KisiTuru !== filters.KisiTuru)
        return false;
      if (filters.IlKodu && k.IlKodu !== filters.IlKodu) return false;
      if (filters.Kaynak) {
        const kaynak = k.Kaynak?.trim() ?? "";
        if (filters.Kaynak === KAYNAK_BOS ? kaynak !== "" : kaynak !== filters.Kaynak)
          return false;
      }
      if (filters.Randevu === "bekleyen" && !(k.BekleyenRandevuSayisi > 0))
        return false;
      if (filters.Randevu === "yok" && k.BekleyenRandevuSayisi > 0)
        return false;
      if (filters.Randevu === "gecikmis" && !randevuGecikmis(k, simdi))
        return false;
      if (!q) return true;
      return (
        ARANAN_ALANLAR.some((alan) => normalize(k[alan] ?? "").includes(q)) ||
        normalize(ilAdi(k.IlKodu) ?? "").includes(q)
      );
    });
  }, [kisiler, arama, filters, ilAdi]);

  // Filtre seçenekleri listede geçen kaynaklardan (web formu kodları + elle yazılanlar)
  const kaynakSecenekleri = useMemo(() => {
    const degerler = new Set<string>();
    let bosVar = false;
    for (const k of kisiler) {
      const kaynak = k.Kaynak?.trim();
      if (kaynak) degerler.add(kaynak);
      else bosVar = true;
    }
    const secenekler = [...degerler]
      .map((value) => ({ value, label: kaynakEtiket(value) ?? value }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
    return bosVar ? [...secenekler, { value: KAYNAK_BOS, label: "Belirtilmemiş" }] : secenekler;
  }, [kisiler]);

  const handleFilterChange = useCallback(
    (next: KisiFiltreleri) => setFilters(next),
    [],
  );
  const handleFilterReset = useCallback(
    () => setFilters(BOS_KISI_FILTRELERI),
    [],
  );

  const exportColumns = useMemo<ExportColumn<CrmKisiRow>[]>(
    () => [
      {
        header: musteri ? "Müşteri" : "Kontak",
        accessorKey: (k) => kisiAdi(k),
      },
      { header: "Kişi Türü", accessorKey: kisiTuruEtiket },
      {
        header: "Yetkili Kişi",
        accessorKey: (k) => (k.Kurum ? k.YetkiliKisi : null),
      },
      { header: "Pozisyon", accessorKey: "YetkiliKisiPozisyonu" },
      { header: "Cep Telefonu", accessorKey: "CepTelefon" },
      { header: "İş Telefonu", accessorKey: "YetkiliKisiTel" },
      { header: "E-posta", accessorKey: "YetkiliKisiEPostaAdresi" },
      { header: "Şehir", accessorKey: (k) => ilAdi(k.IlKodu) },
      { header: "Adres", accessorKey: "Adres" },
      {
        header: "Vergi / TC No",
        accessorKey: (k) => (k.KisiTuru === 2 ? k.VergiNo : k.TcKimlikNo),
      },
      { header: "Kaynak", accessorKey: (k) => kaynakEtiket(k.Kaynak) },
      { header: "Görüşme", accessorKey: "GorusmeSayisi", format: "number" },
      { header: "Son Görüşme", accessorKey: "SonGorusmeTarihi" },
      { header: "Sıradaki Randevu", accessorKey: "SiradakiRandevuTarihi" },
      {
        header: musteri ? "Müşteri Olma" : "Oluşturma",
        accessorKey: (k) =>
          musteri
            ? (k.MusteriOlmaTarihi ?? k.OlusturmaTarihi)
            : k.OlusturmaTarihi,
      },
      { header: "Durum", accessorKey: (k) => (k.Durum ? "Aktif" : "Pasif") },
    ],
    [musteri, ilAdi],
  );

  const formuAc = (kisi: CrmKisiRow | null) => {
    setDuzenlenecek(kisi);
    setFormAcik(true);
  };

  const onayla = async () => {
    if (!onay) return;
    try {
      if (onay.tip === "sil") {
        const { Sonuc } = await sil.mutateAsync(onay.kisi.IDCrmKisi);
        if (Sonuc === "PASIF") {
          // Hata değil: tahsilatı olduğu için kayıt korunur, liste pasif olarak gösterir.
          toast.success(`${etiket} pasife alındı.`, {
            description: "Tahsilat kaydı olduğu için silinmedi; satış ve finans geçmişi korunur.",
          });
        } else {
          toast.success(`${etiket} silindi.`);
          if (String(onay.kisi.IDCrmKisi) === seciliID) setSeciliID(null);
        }
      } else {
        await donustur.mutateAsync(onay.kisi.IDCrmKisi);
        toast.success("Kontak müşteriye dönüştürüldü.", {
          description: "Müşteriler sekmesinde listelenir.",
        });
        // Kayıt bu listeden çıktığı için drawer kapanır.
        setSeciliID(null);
      }
      setOnay(null);
    } catch (error) {
      toast.error((error as Error)?.message || "İşlem yapılamadı.");
    }
  };

  const columns = useMemo<ColumnDef<CrmKisiRow>[]>(
    () => [
      {
        id: "actions",
        size: 50,
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            actions={[
              {
                label: "Görüşme Detayları",
                icon: MessagesSquare,
                onClick: (r) => setSeciliID(String(r.IDCrmKisi)),
              },
              { label: "Düzenle", icon: Pencil, onClick: (r) => formuAc(r) },
              {
                label: "Görüşme Ekle",
                icon: MessageSquarePlus,
                onClick: (r) =>
                  setAktiviteMod({ tip: "yeni", kisi: r, durum: 1 }),
              },
              {
                label: "Randevu Planla",
                icon: CalendarPlus,
                onClick: (r) =>
                  setAktiviteMod({ tip: "yeni", kisi: r, durum: 0 }),
              },
              {
                label: "Teklif Oluştur",
                icon: FilePlus2,
                onClick: (r) =>
                  setTeklifMod({ tip: "yeni", IDCrmKisi: r.IDCrmKisi }),
              },
              { divider: true },
              {
                label: "Müşteriye Dönüştür",
                icon: UserCheck,
                hidden: (r) => r.Tip === "Musteri",
                onClick: (r) => setOnay({ tip: "donustur", kisi: r }),
              },
              { divider: true },
              {
                label: "Sil",
                icon: Trash2,
                variant: "danger",
                onClick: (r) => setOnay({ tip: "sil", kisi: r }),
              },
            ]}
          />
        ),
      },
      {
        id: "Ad",
        accessorFn: (k) => kisiAdi(k),
        header: musteri ? "Müşteri" : "Kontak",
        cell: ({ row }) => {
          const k = row.original;
          const alt = [
            k.Kurum && k.YetkiliKisi ? k.YetkiliKisi : null,
            k.YetkiliKisiPozisyonu,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {kisiAdi(k)}
              </p>
              {alt && (
                <p className="truncate text-xs text-muted-foreground">{alt}</p>
              )}
            </div>
          );
        },
      },
      {
        // Telefon ve e-posta tek kolonda alt alta (grid çok genişlemesin)
        id: "Iletisim",
        accessorFn: (k) =>
          [k.CepTelefon || k.YetkiliKisiTel, k.YetkiliKisiEPostaAdresi]
            .filter(Boolean)
            .join(" "),
        header: "İletişim",
        cell: ({ row }) => {
          const k = row.original;
          const telefon = k.CepTelefon || k.YetkiliKisiTel;
          const eposta = k.YetkiliKisiEPostaAdresi;
          if (!telefon && !eposta) return <span>-</span>;
          return (
            <div className="min-w-0">
              {telefon && <p className="truncate">{telefon}</p>}
              {eposta && (
                <p className="truncate text-xs text-muted-foreground">{eposta}</p>
              )}
            </div>
          );
        },
      },
      {
        id: "Sehir",
        accessorFn: (k) => ilAdi(k.IlKodu) ?? "",
        header: "Şehir",
        cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>,
      },
      {
        id: "Kaynak",
        accessorFn: (k) => kaynakEtiket(k.Kaynak) ?? "",
        header: "Kaynak",
        cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>,
      },
      {
        accessorKey: "GorusmeSayisi",
        header: "Görüşme",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.GorusmeSayisi}</span>
        ),
      },
      {
        accessorKey: "SonGorusmeTarihi",
        header: "Son Görüşme",
        cell: ({ row }) => (
          <span>{formatDate(row.original.SonGorusmeTarihi)}</span>
        ),
      },
      {
        accessorKey: "SiradakiRandevuTarihi",
        header: "Sıradaki Randevu",
        cell: ({ row }) => {
          const deger = row.original.SiradakiRandevuTarihi;
          const gecikti = randevuGecikmis(row.original, new Date());
          return (
            <span className={cn(gecikti && "font-medium text-destructive")}>
              {formatDate(deger, "dd.MM.yyyy HH:mm")}
              {gecikti && " · gecikti"}
            </span>
          );
        },
      },
      {
        id: "Tarih",
        accessorFn: (k) =>
          musteri
            ? (k.MusteriOlmaTarihi ?? k.OlusturmaTarihi)
            : k.OlusturmaTarihi,
        header: musteri ? "Müşteri Olma" : "Oluşturma",
        cell: ({ getValue }) => <span>{formatDate(getValue() as string)}</span>,
      },
      {
        accessorKey: "Durum",
        header: "Durum",
        cell: ({ row }) => (
          <Badge variant={row.original.Durum ? "success" : "danger"}>
            {row.original.Durum ? "Aktif" : "Pasif"}
          </Badge>
        ),
      },
    ],
    [musteri, ilAdi],
  );

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="w-full sm:w-64 sm:shrink-0">
          <Input
            startIcon={<Search className="size-4" />}
            placeholder="Ad, telefon, e-posta veya şehir ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <KisiFiltre
            filters={filters}
            kaynakSecenekleri={kaynakSecenekleri}
            baslik={musteri ? "Müşteri" : "Kontak"}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
          />
          {/* Müşteri doğrudan eklenmez; kontak oluşturulup müşteriye dönüştürülür. */}
          {!musteri && (
            <Button type="button" size="sm" onClick={() => formuAc(null)}>
              <Plus className="size-4" />
              Yeni {etiket}
            </Button>
          )}
          <ExportMenu
            data={filtrelenmis}
            exportColumns={exportColumns}
            title={musteri ? "Müşteri Listesi" : "Kontak Listesi"}
            fileName={musteri ? "musteri-listesi" : "kontak-listesi"}
          />
          <div className="shrink-0">
            <CustomColumnVisibility
              columns={columns}
              value={columnVisibility}
              onChange={setColumnVisibility}
            />
          </div>
        </div>
      </div>

      <CustomDataTable
        data={filtrelenmis}
        columns={columns}
        getRowId={(k) => String(k.IDCrmKisi)}
        onRowClick={(k) => setSeciliID(String(k.IDCrmKisi))}
        pageResetKey={`${arama}|${JSON.stringify(filters)}`}
        columnVisibilityValue={columnVisibility}
        onColumnVisibilityValueChange={setColumnVisibility}
        emptyMessage={
          isError
            ? `${etiket} listesi getirilemedi.`
            : arama || filtrelenmis.length !== kisiler.length
              ? "Arama veya filtreye uygun kayıt bulunamadı."
              : musteri
                ? "Henüz müşteri yok. Kontaklar sekmesinden bir kontağı müşteriye dönüştürebilirsiniz."
                : "Henüz kontak eklenmedi."
        }
        onRetry={isError ? () => refetch() : undefined}
      />

      <KisiFormDialog
        open={formAcik}
        onOpenChange={(v) => {
          setFormAcik(v);
          if (!v) setDuzenlenecek(null);
        }}
        tip={tip}
        kisi={duzenlenecek}
      />

      <KisiDrawer
        kisi={secili}
        onOpenChange={(v) => !v && setSeciliID(null)}
        onDuzenle={(k) => formuAc(k)}
        onDonustur={(k) => setOnay({ tip: "donustur", kisi: k })}
        onSil={(k) => setOnay({ tip: "sil", kisi: k })}
      />

      <AktiviteFormDialog
        open={!!aktiviteMod}
        onOpenChange={(v) => !v && setAktiviteMod(null)}
        mod={aktiviteMod}
      />

      <TeklifFormDialog
        open={!!teklifMod}
        onOpenChange={(v) => !v && setTeklifMod(null)}
        mod={teklifMod}
      />

      <ConfirmDialog
        open={!!onay}
        onOpenChange={(v) => !v && setOnay(null)}
        title={onay?.tip === "sil" ? `${etiket} sil` : "Müşteriye dönüştür"}
        description={
          onay?.tip === "sil"
            ? `"${onay ? kisiAdi(onay.kisi) : ""}" görüşme, randevu ve satışlarıyla birlikte kalıcı olarak silinecek; takvimdeki randevuları da kaldırılacak. Bu işlem geri alınamaz. Tahsilat kaydı varsa silinmez, pasife alınır.`
            : `"${onay ? kisiAdi(onay.kisi) : ""}" müşteri olarak işaretlenecek. Görüşme ve randevuları korunur.`
        }
        variant={onay?.tip === "sil" ? "danger" : "success"}
        confirmLabel={onay?.tip === "sil" ? "Sil" : "Dönüştür"}
        isLoading={sil.isPending || donustur.isPending}
        onConfirm={onayla}
      />
    </div>
  );
}
