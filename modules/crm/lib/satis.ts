import type { ComponentProps } from "react";
import { addDays, addMonths, addYears, format, parseISO } from "date-fns";

import type { Badge } from "@/components/ui/badge";
import { ODEME_SEKLI_VARSAYILAN } from "@/modules/crm/lib/finans";
import {
  belgeTemelBilgileri,
  bosKalem,
  formGenelIskonto,
  formKalemGirdileri,
  genelIskontoFormu,
  gunFormat,
  kalemFormu,
  pdfDosyaAdi,
  pdfKisi,
  teklifHesapla,
} from "@/modules/crm/lib/teklif";
import type { SatisForm, SatisIptalForm } from "@/modules/crm/schemas/satis.schema";
import { sayiOku } from "@/modules/crm/schemas/teklif.schema";
import type {
  CrmTahsilatKaydetParams,
  TahsilatOdemeSekli,
} from "@/modules/crm/types/finans";
import type {
  CrmSatisDetay,
  CrmSatisKaydetParams,
  CrmSatisRow,
  DbId,
  SatisDonemDurumu,
  SatisDurum,
  SatisTipi,
} from "@/modules/crm/types/satis";
import type { BelgePdfKisiEk, BelgePdfVeri, TeklifDetay } from "@/modules/crm/types/teklif";

/* ------------------------------------------------------------------ */
/* Etiketler / seçenekler                                              */
/* ------------------------------------------------------------------ */

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export const SATIS_DURUM: Record<SatisDurum, { label: string; variant: BadgeVariant }> = {
  0: { label: "Geçerli", variant: "success" },
  1: { label: "İptal", variant: "danger" },
};

export const SATIS_TIPI_ETIKET: Record<SatisTipi, string> = {
  1: "Tek seferlik",
  2: "Aylık abonelik",
  3: "Yıllık abonelik",
};

export const SATIS_TIPI_SECENEKLERI = (
  Object.entries(SATIS_TIPI_ETIKET) as [`${SatisTipi}`, string][]
).map(([value, label]) => ({ value, label }));

export const DONEM_DURUM: Record<SatisDonemDurumu, { label: string; variant: BadgeVariant }> = {
  0: { label: "Tek seferlik", variant: "gray" },
  1: { label: "Başlamadı", variant: "info" },
  2: { label: "Devam ediyor", variant: "success" },
  3: { label: "Süresi doldu", variant: "orange" },
};

/** Yenileme uyarısının varsayılan ufku (gün). SP varsayılanıyla aynı. */
export const YENILEME_GUN_VARSAYILAN = 30;

export const abonelikMi = (tip: SatisTipi | `${SatisTipi}`) => Number(tip) !== 1;

/** "Bitişe 12 gün" / "Bugün bitiyor" / "5 gün önce bitti". Tek seferlikte null. */
export function yenilemeMetni(gunKalan: number | null | undefined) {
  if (gunKalan == null) return null;
  if (gunKalan > 0) return `Bitişe ${gunKalan} gün`;
  if (gunKalan === 0) return "Bugün bitiyor";
  return `${-gunKalan} gün önce bitti`;
}

/* ------------------------------------------------------------------ */
/* Durum kuralları (SP ile aynı)                                       */
/* ------------------------------------------------------------------ */

type IzinSatir = Pick<CrmSatisRow, "Durum" | "SatisTipi" | "YenilendiMi">;

export const satisIzin = {
  duzenle: (s: IzinSatir) => s.Durum === 0,
  iptal: (s: IzinSatir) => s.Durum === 0,
  yenile: (s: IzinSatir) => s.Durum === 0 && abonelikMi(s.SatisTipi) && !s.YenilendiMi,
  /**
   * Yenilemesi olan satış SP'de, tahsilatı olan FK ile reddedilir.
   * `tahsilatVar` rozet sorgusundan (useCrmSatisTahsilatlari) gelir.
   */
  sil: (s: IzinSatir, tahsilatVar: boolean) => !s.YenilendiMi && !tahsilatVar,
};

/* ------------------------------------------------------------------ */
/* Dönem                                                               */
/* ------------------------------------------------------------------ */

/**
 * Abonelikte önerilen bitiş: başlangıç + 1 ay / 1 yıl − 1 gün
 * (01.12.2026 yıllık → 30.11.2027). Yenileme SP'si de aynı kuralı kullanır.
 * Tek seferlikte veya başlangıç boşsa "".
 */
export function bitisOner(tip: SatisTipi | `${SatisTipi}`, baslangic: string) {
  if (!abonelikMi(tip) || !baslangic) return "";
  const bas = parseISO(baslangic);
  if (Number.isNaN(bas.getTime())) return "";
  const sonraki = Number(tip) === 2 ? addMonths(bas, 1) : addYears(bas, 1);
  return format(addDays(sonraki, -1), "yyyy-MM-dd");
}

/* ------------------------------------------------------------------ */
/* Form ↔ API                                                          */
/* ------------------------------------------------------------------ */

const bugun = () => format(new Date(), "yyyy-MM-dd");
const gun = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");
const sayi = (v: string | number | null | undefined) => {
  const n = sayiOku(v);
  return Number.isFinite(n) ? n : 0;
};

/** Ödeme bloğu boş (Ödeme alındı işaretsiz). */
const odemeBos = () => ({
  OdemeAlindi: false,
  OdemeTarihi: bugun(),
  OdemeTutari: "",
  OdemeSekli: ODEME_SEKLI_VARSAYILAN,
  OdemeFaturaNo: "",
});

const kalemlerFormu = (kalemler: CrmSatisDetay["Kalemler"] | TeklifDetay["Kalemler"]) =>
  kalemler.length ? kalemler.map(kalemFormu) : [bosKalem()];

/** Yeni satış (bugün, tek seferlik, TRY, tek boş kalem) veya mevcut satışın form değerleri. */
export function satisFormVarsayilan(s?: CrmSatisDetay | null, IDCrmKisi?: DbId | null): SatisForm {
  if (!s) {
    return {
      IDCrmKisi: IDCrmKisi != null ? String(IDCrmKisi) : "",
      SatisTipi: "1",
      Konu: "",
      SatisTarihi: bugun(),
      BaslangicTarihi: "",
      BitisTarihi: "",
      ParaBirimi: "TRY",
      Kur: "1",
      GenelIskontoTipi: "1",
      GenelIskonto: "",
      Aciklama: "",
      Kalemler: [bosKalem()],
      ...odemeBos(),
    };
  }

  return {
    IDCrmKisi: String(s.IDCrmKisi),
    SatisTipi: String(s.SatisTipi) as SatisForm["SatisTipi"],
    Konu: s.Konu,
    SatisTarihi: gun(s.SatisTarihi),
    BaslangicTarihi: gun(s.BaslangicTarihi),
    BitisTarihi: gun(s.BitisTarihi),
    ParaBirimi: s.ParaBirimi,
    Kur: String(s.Kur ?? 1),
    ...genelIskontoFormu(s),
    Aciklama: s.Aciklama ?? "",
    Kalemler: kalemlerFormu(s.Kalemler),
    // Düzenlemede ödeme adımı yok.
    ...odemeBos(),
  };
}

/**
 * "Satışa dönüştür": kabul edilmiş teklifin kişi, konu, para birimi, iskonto
 * ve kalemleriyle dolu yeni satış formu. Tip ve dönem kullanıcı seçer.
 * Teklifin açıklaması ve koşulları taşınmaz (teklife özgü metinler).
 */
export function satisFormTekliften(t: TeklifDetay): SatisForm {
  return {
    ...satisFormVarsayilan(null, t.IDCrmKisi),
    Konu: t.Konu,
    ParaBirimi: t.ParaBirimi,
    Kur: String(t.Kur ?? 1),
    ...genelIskontoFormu(t),
    Kalemler: kalemlerFormu(t.Kalemler),
  };
}

/** Form → servis parametreleri (insert ve update ortak); tutarlar burada hesaplanır. */
export function satisFormdanParams(f: SatisForm, IDCrmTeklif?: DbId | null): CrmSatisKaydetParams {
  const h = teklifHesapla(formKalemGirdileri(f.Kalemler), formGenelIskonto(f));
  const abonelik = abonelikMi(f.SatisTipi);
  return {
    IDCrmKisi: f.IDCrmKisi,
    IDCrmTeklif: IDCrmTeklif ?? null,
    SatisTipi: Number(f.SatisTipi) as SatisTipi,
    SatisTarihi: f.SatisTarihi,
    BaslangicTarihi: abonelik ? f.BaslangicTarihi || null : null,
    BitisTarihi: abonelik ? f.BitisTarihi || null : null,
    Konu: f.Konu.trim(),
    Aciklama: f.Aciklama.trim() || null,
    ParaBirimi: f.ParaBirimi,
    Kur: f.ParaBirimi === "TRY" ? 1 : sayi(f.Kur),
    GenelIskontoOrani: h.GenelIskontoOrani,
    Kalemler: h.kalemler,
    AraToplam: h.AraToplam,
    GenelIskontoTutari: h.GenelIskontoTutari,
    IskontoToplam: h.IskontoToplam,
    KdvToplam: h.KdvToplam,
    GenelToplam: h.GenelToplam,
  };
}

/**
 * "Ödeme alındı" → satış kaydedildikten sonra gönderilecek tahsilat.
 * İşaretsizse null. Para birimi ve kur gönderilmez (satışınki kullanılır).
 */
export function odemeFormdanTahsilat(f: SatisForm, IDCrmSatis: DbId): CrmTahsilatKaydetParams | null {
  if (!f.OdemeAlindi) return null;
  return {
    IDCrmSatis,
    Tip: 1,
    Tarih: f.OdemeTarihi,
    Tutar: sayi(f.OdemeTutari),
    OdemeSekli: Number(f.OdemeSekli) as TahsilatOdemeSekli,
    FaturaNo: f.OdemeFaturaNo.trim() || null,
  };
}

/* ------------------------------------------------------------------ */
/* İptal                                                               */
/* ------------------------------------------------------------------ */

/**
 * İptal formu. Net tahsilat varsa iade önerilir (işaretli gelir, tutar =
 * tahsil edilen); yoksa iade bloğu gösterilmez.
 */
export function iptalFormVarsayilan(tahsilEdilen: number): SatisIptalForm {
  return {
    IptalNedeni: "",
    IadeAc: tahsilEdilen > 0,
    IadeTarihi: bugun(),
    IadeTutari: tahsilEdilen > 0 ? String(tahsilEdilen) : "",
    IadeOdemeSekli: ODEME_SEKLI_VARSAYILAN,
  };
}

/** İptal sonrası gönderilecek iade (Tip 2). İşaretsizse null. */
export function iptalFormdanIade(f: SatisIptalForm, IDCrmSatis: DbId): CrmTahsilatKaydetParams | null {
  if (!f.IadeAc) return null;
  return {
    IDCrmSatis,
    Tip: 2,
    Tarih: f.IadeTarihi,
    Tutar: sayi(f.IadeTutari),
    OdemeSekli: Number(f.IadeOdemeSekli) as TahsilatOdemeSekli,
    Aciklama: f.IptalNedeni.trim() || null,
  };
}

/* ------------------------------------------------------------------ */
/* PDF verisi (teklif ile aynı şablon, lib/teklif-pdf.tsx)             */
/* ------------------------------------------------------------------ */

/**
 * Kayıtlı satış → PDF verisi. Kişinin adres / vergi bilgisi kişi kartından
 * (useBelgePdfKisiEk) verilir. Belge sadece satış bilgisini taşır; tahsilat /
 * kalan tutar (finans) bilinçli olarak yazılmaz.
 */
export function satisPdfVerisi(s: CrmSatisDetay, kisiEk: BelgePdfKisiEk | null | undefined): BelgePdfVeri {
  const iptal = s.Durum === 1;
  return {
    BelgeAdi: "Satış",
    BelgeNo: s.SatisNo,
    Meta: [
      { etiket: "Satış No", deger: s.SatisNo },
      { etiket: "Tarih", deger: gunFormat(s.SatisTarihi) },
      { etiket: "Satış Tipi", deger: SATIS_TIPI_ETIKET[s.SatisTipi] },
      ...(abonelikMi(s.SatisTipi) && s.BaslangicTarihi && s.BitisTarihi
        ? [{ etiket: "Dönem", deger: `${gunFormat(s.BaslangicTarihi)} – ${gunFormat(s.BitisTarihi)}` }]
        : []),
    ],
    Etiket: iptal ? { metin: "İPTAL EDİLDİ", tur: "tehlike" } : null,
    Bilgiler: [
      ...belgeTemelBilgileri(s),
      ...(s.TeklifNoTam ? [{ etiket: "Teklif No", deger: s.TeklifNoTam }] : []),
    ],
    ParaBirimi: s.ParaBirimi,
    Kur: s.Kur,
    GenelIskontoOrani: s.GenelIskontoOrani,
    Aciklama: s.Aciklama,
    Kosullar: null,
    Kalemler: s.Kalemler,
    Toplamlar: {
      AraToplam: s.AraToplam,
      GenelIskontoTutari: s.GenelIskontoTutari,
      IskontoToplam: s.IskontoToplam,
      KdvToplam: s.KdvToplam,
      GenelToplam: s.GenelToplam,
    },
    Kisi: pdfKisi(s, kisiEk, s.KisiAdi),
  };
}

/** "Satis-S2026-0001.pdf" */
export const satisPdfDosyaAdi = (no: string) => pdfDosyaAdi("Satis", no);
