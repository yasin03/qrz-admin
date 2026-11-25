import type { ComponentProps } from "react";
import { format } from "date-fns";

import type { Badge } from "@/components/ui/badge";
import { paraSembol } from "@/constants/data";
import { formatMoney } from "@/lib/format";
import { sayiOku, type TeklifForm, type TeklifKalemForm } from "@/modules/crm/schemas/teklif.schema";
import type {
  TeklifAlanlari,
  TeklifDetay,
  TeklifDurum,
  TeklifKalem,
  TeklifKalemGirdi,
  TeklifKalemTutarlari,
  TeklifParaBirimi,
  TeklifPdfVeri,
  TeklifRow,
  TeklifToplamlari,
} from "@/modules/crm/types/teklif";
import type { CrmKisiRow } from "@/modules/crm/types/kisiler";

/* ------------------------------------------------------------------ */
/* Etiketler / seçenekler                                              */
/* ------------------------------------------------------------------ */

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export const TEKLIF_DURUM: Record<TeklifDurum, { label: string; variant: BadgeVariant }> = {
  0: { label: "Taslak", variant: "gray" },
  1: { label: "Gönderildi", variant: "info" },
  2: { label: "Kabul", variant: "success" },
  3: { label: "Red", variant: "danger" },
  4: { label: "İptal", variant: "warning" },
  5: { label: "Revize edildi", variant: "purple" },
};

/** Listede gösterilecek durum: gönderilmiş + süresi geçmiş → "Süresi doldu". */
export function teklifDurumGorunum(t: Pick<TeklifRow, "Durum" | "SuresiDoldu">) {
  if (t.Durum === 1 && t.SuresiDoldu) return { label: "Süresi doldu", variant: "orange" as BadgeVariant };
  return TEKLIF_DURUM[t.Durum];
}

/**
 * Gün → "dd.MM.yyyy". "2026-11-23" (form) ve "2026-11-23T00:00:00.000Z" (API)
 * ikisini de kabul eder; lib/format formatDate sadece ikincisini kabul edip
 * diğerinde hata fırlattığı için teklif tarihleri bununla gösterilir.
 */
export function gunFormat(v: string | null | undefined) {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})/.exec(v) : null;
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "-";
}

/** 1234.5, "USD" → "1.234,50 $" */
export const paraFormat = (v: number | null | undefined, pb: TeklifParaBirimi | string | null | undefined) =>
  `${formatMoney(v ?? 0)} ${paraSembol(pb)}`;

/* ------------------------------------------------------------------ */
/* Durum kuralları (SP ile aynı)                                       */
/* ------------------------------------------------------------------ */

export const teklifIzin = {
  duzenle: (d: TeklifDurum) => d === 0,
  gonder: (d: TeklifDurum) => d === 0,
  kabul: (d: TeklifDurum) => d === 1,
  red: (d: TeklifDurum) => d === 1,
  iptal: (d: TeklifDurum) => d === 0 || d === 1,
  iptalGeriAl: (d: TeklifDurum) => d === 4,
  revize: (d: TeklifDurum) => d === 1 || d === 3,
  sil: (d: TeklifDurum) => d === 0,
};

/* ------------------------------------------------------------------ */
/* Hesaplama — tutarların tek kaynağı (DB hesaplamaz)                  */
/* ------------------------------------------------------------------ */

/** 2 basamağa yuvarlama (0.005 → 0.01). */
export const yuvarla = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const sayi = (v: string | number | null | undefined) => {
  const n = sayiOku(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Satır:
 *   Tutar        = Miktar × BirimFiyat
 *   İskonto      = Tutar × İsk% / 100
 *   Net (matrah) = Tutar − İskonto
 *   KDV          = Net × KDV% / 100
 *   Toplam       = Net + KDV
 */
export function kalemHesapla(k: Pick<TeklifKalemGirdi, "Miktar" | "BirimFiyat" | "IskontoOrani" | "KdvOrani">): TeklifKalemTutarlari {
  const Tutar = yuvarla(k.Miktar * k.BirimFiyat);
  const IskontoTutari = yuvarla((Tutar * k.IskontoOrani) / 100);
  const NetTutar = yuvarla(Tutar - IskontoTutari);
  const KdvTutari = yuvarla((NetTutar * k.KdvOrani) / 100);
  return { Tutar, IskontoTutari, NetTutar, KdvTutari, ToplamTutar: yuvarla(NetTutar + KdvTutari) };
}

export type TeklifHesap = TeklifToplamlari & {
  kalemler: TeklifKalem[];
  /** Satır iskontoları sonrası, genel iskonto öncesi. */
  NetToplam: number;
  /** Genel iskonto sonrası KDV oranı → KDV tutarı. */
  kdvDagilimi: { oran: number; tutar: number }[];
};

/**
 * Başlık:
 *   AraToplam          = Σ Tutar
 *   GenelIskontoTutari = Σ Net × GenelIsk% / 100
 *   IskontoToplam      = Σ satır iskontosu + genel iskonto
 *   KdvToplam          = Σ KDV × (1 − GenelIsk% / 100)  (iskontolu matrahtan KDV)
 *   GenelToplam        = Σ Net − genel iskonto + KdvToplam
 */
export function teklifHesapla(girdiler: TeklifKalemGirdi[], genelIskontoOrani: number): TeklifHesap {
  const kalemler = girdiler.map((g) => ({ ...g, ...kalemHesapla(g) }));
  const genelOran = Math.min(Math.max(genelIskontoOrani || 0, 0), 100) / 100;

  const topla = (f: (k: TeklifKalem) => number) => yuvarla(kalemler.reduce((s, k) => s + f(k), 0));
  const AraToplam = topla((k) => k.Tutar);
  const satirIskonto = topla((k) => k.IskontoTutari);
  const NetToplam = topla((k) => k.NetTutar);
  const GenelIskontoTutari = yuvarla(NetToplam * genelOran);
  const KdvToplam = yuvarla(topla((k) => k.KdvTutari) * (1 - genelOran));

  const oranlar = new Map<number, number>();
  for (const k of kalemler) oranlar.set(k.KdvOrani, (oranlar.get(k.KdvOrani) ?? 0) + k.KdvTutari);
  const kdvDagilimi = [...oranlar.entries()]
    .filter(([oran]) => oran > 0)
    .sort(([a], [b]) => a - b)
    .map(([oran, tutar]) => ({ oran, tutar: yuvarla(tutar * (1 - genelOran)) }));

  return {
    kalemler,
    AraToplam,
    NetToplam,
    GenelIskontoTutari,
    IskontoToplam: yuvarla(satirIskonto + GenelIskontoTutari),
    KdvToplam,
    GenelToplam: yuvarla(NetToplam - GenelIskontoTutari + KdvToplam),
    kdvDagilimi,
  };
}

/* ------------------------------------------------------------------ */
/* Form ↔ API                                                          */
/* ------------------------------------------------------------------ */

/** Teklifte yeni kalem eklenince seçili gelen birim ve KDV oranı (BIRIM_DATA / KDV_DATA değerleri). */
const KALEM_BIRIM_VARSAYILAN = "Adet";
const KALEM_KDV_VARSAYILAN = "20";

const bugun = () => format(new Date(), "yyyy-MM-dd");
const gun = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");
const ileri = (gunSayisi: number) => format(new Date(Date.now() + gunSayisi * 86_400_000), "yyyy-MM-dd");

export const bosKalem = (): TeklifKalemForm => ({
  Aciklama: "",
  Detay: "",
  Miktar: "1",
  Birim: KALEM_BIRIM_VARSAYILAN,
  BirimFiyat: "",
  IskontoOrani: "",
  KdvOrani: KALEM_KDV_VARSAYILAN,
});

/** Yeni teklif (bugün, 30 gün geçerli, TRY, tek boş kalem) veya mevcut teklifin form değerleri. */
export function teklifFormVarsayilan(t?: TeklifDetay | null, IDCrmKisi?: string | number | null): TeklifForm {
  if (!t) {
    return {
      IDCrmKisi: IDCrmKisi != null ? String(IDCrmKisi) : "",
      Konu: "",
      TeklifTarihi: bugun(),
      GecerlilikTarihi: ileri(30),
      ParaBirimi: "TRY",
      Kur: "1",
      GenelIskontoOrani: "",
      Aciklama: "",
      Kosullar: "",
      Kalemler: [bosKalem()],
    };
  }

  return {
    IDCrmKisi: String(t.IDCrmKisi),
    Konu: t.Konu,
    TeklifTarihi: gun(t.TeklifTarihi),
    GecerlilikTarihi: gun(t.GecerlilikTarihi),
    ParaBirimi: t.ParaBirimi,
    Kur: String(t.Kur ?? 1),
    GenelIskontoOrani: t.GenelIskontoOrani ? String(t.GenelIskontoOrani) : "",
    Aciklama: t.Aciklama ?? "",
    Kosullar: t.Kosullar ?? "",
    Kalemler: t.Kalemler.length
      ? t.Kalemler.map((k) => ({
          Aciklama: k.Aciklama,
          Detay: k.Detay ?? "",
          Miktar: String(k.Miktar),
          Birim: k.Birim,
          BirimFiyat: String(k.BirimFiyat),
          IskontoOrani: k.IskontoOrani ? String(k.IskontoOrani) : "",
          KdvOrani: String(k.KdvOrani),
        }))
      : [bosKalem()],
  };
}

/** Form kalemleri → hesaplamaya girecek sayılar (canlı önizleme ve kayıt ortak). */
export function formKalemGirdileri(kalemler: TeklifKalemForm[] | undefined): TeklifKalemGirdi[] {
  return (kalemler ?? []).map((k) => ({
    Aciklama: k.Aciklama?.trim() ?? "",
    Detay: k.Detay?.trim() || null,
    Miktar: sayi(k.Miktar),
    Birim: k.Birim?.trim() || KALEM_BIRIM_VARSAYILAN,
    BirimFiyat: sayi(k.BirimFiyat),
    IskontoOrani: sayi(k.IskontoOrani),
    KdvOrani: sayi(k.KdvOrani),
  }));
}

/** Form → servis parametreleri (insert ve update ortak); tutarlar burada hesaplanır. */
export function teklifFormdanParams(f: TeklifForm): TeklifAlanlari {
  const genelIskontoOrani = sayi(f.GenelIskontoOrani);
  const h = teklifHesapla(formKalemGirdileri(f.Kalemler), genelIskontoOrani);
  return {
    IDCrmKisi: f.IDCrmKisi,
    Konu: f.Konu.trim(),
    TeklifTarihi: f.TeklifTarihi,
    GecerlilikTarihi: f.GecerlilikTarihi || null,
    ParaBirimi: f.ParaBirimi,
    Kur: f.ParaBirimi === "TRY" ? 1 : sayi(f.Kur),
    GenelIskontoOrani: genelIskontoOrani,
    Aciklama: f.Aciklama.trim() || null,
    Kosullar: f.Kosullar.trim() || null,
    Kalemler: h.kalemler,
    AraToplam: h.AraToplam,
    GenelIskontoTutari: h.GenelIskontoTutari,
    IskontoToplam: h.IskontoToplam,
    KdvToplam: h.KdvToplam,
    GenelToplam: h.GenelToplam,
  };
}

/* ------------------------------------------------------------------ */
/* PDF verisi                                                          */
/* ------------------------------------------------------------------ */

type PdfKisi = Pick<CrmKisiRow, "Kurum" | "YetkiliKisi" | "CepTelefon" | "YetkiliKisiTel" | "YetkiliKisiEPostaAdresi">;

const pdfKisi = (k: PdfKisi | null | undefined, ad?: string | null): TeklifPdfVeri["Kisi"] => ({
  Ad: k?.Kurum?.trim() || k?.YetkiliKisi?.trim() || ad || "-",
  Yetkili: k?.Kurum?.trim() ? k.YetkiliKisi : null,
  Telefon: k?.CepTelefon || k?.YetkiliKisiTel || null,
  Eposta: k?.YetkiliKisiEPostaAdresi ?? null,
});

/** Kayıtlı teklif → PDF verisi (tutarlar DB'deki değerler). */
export function teklifPdfVerisiDetaydan(t: TeklifDetay): TeklifPdfVeri {
  return {
    TeklifNoTam: t.TeklifNoTam,
    Konu: t.Konu,
    TeklifTarihi: t.TeklifTarihi,
    GecerlilikTarihi: t.GecerlilikTarihi,
    ParaBirimi: t.ParaBirimi,
    Kur: t.Kur,
    GenelIskontoOrani: t.GenelIskontoOrani,
    Aciklama: t.Aciklama,
    Kosullar: t.Kosullar,
    Kalemler: t.Kalemler,
    Toplamlar: {
      AraToplam: t.AraToplam,
      GenelIskontoTutari: t.GenelIskontoTutari,
      IskontoToplam: t.IskontoToplam,
      KdvToplam: t.KdvToplam,
      GenelToplam: t.GenelToplam,
    },
    Kisi: pdfKisi(t, t.KisiAdi),
    Hazirlayan: t.Ad ?? t.KullaniciAdi,
  };
}

/** Form (henüz kaydedilmemiş olabilir) → PDF verisi; tutarlar canlı hesaptan. */
export function teklifPdfVerisiFormdan(
  f: TeklifForm,
  ek: { TeklifNoTam?: string | null; kisi?: PdfKisi | null; Hazirlayan?: string | null },
): TeklifPdfVeri {
  const p = teklifFormdanParams(f);
  return {
    TeklifNoTam: ek.TeklifNoTam || "Taslak",
    Konu: p.Konu,
    TeklifTarihi: p.TeklifTarihi,
    GecerlilikTarihi: p.GecerlilikTarihi,
    ParaBirimi: p.ParaBirimi,
    Kur: p.Kur,
    GenelIskontoOrani: p.GenelIskontoOrani,
    Aciklama: p.Aciklama,
    Kosullar: p.Kosullar,
    Kalemler: p.Kalemler,
    Toplamlar: {
      AraToplam: p.AraToplam,
      GenelIskontoTutari: p.GenelIskontoTutari,
      IskontoToplam: p.IskontoToplam,
      KdvToplam: p.KdvToplam,
      GenelToplam: p.GenelToplam,
    },
    Kisi: pdfKisi(ek.kisi),
    Hazirlayan: ek.Hazirlayan ?? null,
  };
}

/** "Teklif-2026-0001-R1.pdf" */
export const teklifPdfDosyaAdi = (no: string) => `Teklif-${no.replace(/[^\w-]+/g, "-")}.pdf`;
