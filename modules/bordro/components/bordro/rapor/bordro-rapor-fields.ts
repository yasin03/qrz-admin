import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Briefcase,
  CircleCheck,
  CircleMinus,
  Clock,
  HandHeart,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { SectionExportFieldValue } from "@/components/export/section-types";

export type RaporFieldType = "text" | "money" | "number" | "percent" | "boolean";

export type RaporField = {
  key: string;
  label: string;
  type: RaporFieldType;
};

export type RaporGroup = {
  key: string;
  title: string;
  icon: LucideIcon;
  fields: RaporField[];
};

export type RaporValues = Record<string, unknown>;

export const PERSONAL_FIELDS: RaporField[] = [
  { key: "TcKimlikNo", label: "TC Kimlik No", type: "text" },
  { key: "Cinsiyet", label: "Cinsiyet", type: "text" },
  { key: "SicilNo", label: "Sicil No", type: "text" },
  { key: "BolumAdi", label: "Bölüm", type: "text" },
  { key: "GorevAdi", label: "Görev", type: "text" },
  { key: "UnvanAdi", label: "Unvan", type: "text" },
  { key: "IseSonGirisTarihi2", label: "İşe Giriş Tarihi", type: "text" },
  { key: "CikisTarihi2", label: "Çıkış Tarihi", type: "text" },
  { key: "PersonelAyrilisKodu", label: "Ayrılış Kodu", type: "text" },
  { key: "SendikaDurumu", label: "Sendika Durumu", type: "boolean" },
  { key: "OzurlulukDerecesi", label: "Özürlülük Derecesi", type: "number" },
  { key: "SgkDurumu", label: "SGK Durumu", type: "text" },
  { key: "PersonelKanunNo", label: "SGK Kanun No", type: "text" },
  { key: "PersonelSgkBelgeTuru", label: "SGK Belge Türü", type: "text" },
  { key: "PersonelMeslekKodu", label: "Meslek Kodu", type: "text" },
  { key: "OdemeSekli", label: "Ödeme Şekli", type: "text" },
  { key: "UcretTipi", label: "Ücret Tipi", type: "text" },
  { key: "AsgeriUcretli", label: "Asgari Ücretli", type: "boolean" },
  { key: "VergidenMuaf", label: "Vergiden Muaf", type: "boolean" },
];

export const REPORT_GROUPS: RaporGroup[] = [
  {
    key: "calisma",
    title: "Çalışma Bilgileri",
    icon: Briefcase,
    fields: [
      { key: "Ucret", label: "Ücret", type: "money" },
      { key: "NetUcret", label: "Net Ücret", type: "money" },
      { key: "GunlukUcret", label: "Günlük Ücret", type: "money" },
      { key: "SaatlikUcret", label: "Saatlik Ücret", type: "money" },
      { key: "GunSayisi", label: "Çalışma Gün Sayısı", type: "number" },
      { key: "SgkGunSayisi", label: "SGK Gün Sayısı", type: "number" },
      { key: "SgkEksikGun", label: "SGK Eksik Gün", type: "number" },
      { key: "BrutToplamGun", label: "Normal Çalışma Brüt", type: "money" },
      { key: "ToplamGT", label: "GT Gün", type: "number" },
      { key: "BrutToplamGT", label: "GT Brüt", type: "money" },
      { key: "ToplamHT", label: "HT Gün", type: "number" },
      { key: "BrutToplamHT", label: "HT Brüt", type: "money" },
      { key: "ToplamYI", label: "Yİ Gün", type: "number" },
      { key: "BrutToplamYI", label: "Yİ Brüt", type: "money" },
      { key: "SaatSayisi", label: "Saat", type: "number" },
      { key: "BrutSaatSayisi", label: "Saat Brüt", type: "money" },
    ],
  },
  {
    key: "mesai",
    title: "Mesai Bilgileri",
    icon: Clock,
    fields: [
      { key: "ToplamFMs100", label: "FM Saat 100", type: "number" },
      { key: "BrutToplamFMs100", label: "Brüt FM Saat 100", type: "money" },
      { key: "ToplamFMs50", label: "FM Saat 50", type: "number" },
      { key: "BrutToplamFMs50", label: "Brüt FM Saat 50", type: "money" },
      { key: "ToplamFMg100", label: "FM Gün 100", type: "number" },
      { key: "BrutToplamFMg100", label: "Brüt FM Gün 100", type: "money" },
      { key: "ToplamFMg50", label: "FM Gün 50", type: "number" },
      { key: "BrutToplamFMg50", label: "Brüt FM Gün 50", type: "money" },
      { key: "ToplamDMs", label: "DM Saat", type: "number" },
      { key: "BrutToplamDMs", label: "Brüt DM Saat", type: "money" },
      { key: "ToplamDMg", label: "DM Gün", type: "number" },
      { key: "BrutToplamDMg", label: "Brüt DM Gün", type: "money" },
      { key: "ToplamRMs", label: "RM Saat", type: "number" },
      { key: "BrutToplamRMs", label: "Brüt RM Saat", type: "money" },
      { key: "ToplamRMg", label: "RM Gün", type: "number" },
      { key: "BrutToplamRMg", label: "Brüt RM Gün", type: "money" },
      { key: "ToplamTisFMs", label: "TİS FM Saat", type: "number" },
      { key: "BrutToplamTisFMs", label: "Brüt TİS FM Saat", type: "money" },
      { key: "ToplamTisFMg", label: "TİS FM Gün", type: "number" },
      { key: "BrutToplamTisFMg", label: "Brüt TİS FM Gün", type: "money" },
      { key: "ToplamTisDMs", label: "TİS DM Saat", type: "number" },
      { key: "BrutToplamTisDMs", label: "Brüt TİS DM Saat", type: "money" },
      { key: "ToplamTisDMg", label: "TİS DM Gün", type: "number" },
      { key: "BrutToplamTisDMg", label: "Brüt TİS DM Gün", type: "money" },
      { key: "ToplamTisRMs", label: "TİS RM Saat", type: "number" },
      { key: "BrutToplamTisRMs", label: "Brüt TİS RM Saat", type: "money" },
      { key: "ToplamTisRMg", label: "TİS RM Gün", type: "number" },
      { key: "BrutToplamTisRMg", label: "Brüt TİS RM Gün", type: "money" },
      { key: "ToplamTisGeceMg", label: "TİS Gece M Gün", type: "number" },
      {
        key: "BrutToplamTisGeceMg",
        label: "Brüt TİS Gece M Gün",
        type: "money",
      },
      { key: "ToplamTisGeceMs", label: "TİS Gece M Saat", type: "number" },
      {
        key: "BrutToplamTisGeceMs",
        label: "Brüt TİS Gece M Saat",
        type: "money",
      },
    ],
  },
  {
    key: "yardim",
    title: "Yardım Bilgileri",
    icon: HandHeart,
    fields: [
      { key: "AskerlikYardimi", label: "Askerlik Yardımı", type: "money" },
      { key: "BayramOdenegi", label: "Bayram Ödeneği", type: "money" },
      { key: "EgitimUcreti", label: "Eğitim Ücreti", type: "money" },
      { key: "EkdersSaat", label: "Ekders Saat", type: "number" },
      { key: "EkdersUcreti", label: "Ekders Ücreti", type: "money" },
      { key: "IkramiyeOdenegi", label: "İkramiye Ödeneği", type: "money" },
      { key: "EvlilikYardimi", label: "Evlilik Yardımı", type: "money" },
      { key: "MaasFarki", label: "Maaş Farkı", type: "money" },
      { key: "OgrenimYardimi", label: "Öğrenim Yardımı", type: "money" },
      { key: "OlumYardimi", label: "Ölüm Yardımı", type: "money" },
      { key: "SilahTazminati", label: "Silah Tazminatı", type: "money" },
      { key: "TeftisFazlaMesai", label: "Teftiş Fazla Mesai", type: "money" },
      { key: "YakacakYardimi", label: "Yakacak Yardımı", type: "money" },
      { key: "CocukYardimi", label: "Çocuk Yardımı", type: "money" },
      { key: "KucukCocukYardimi", label: "Küçük Çocuk Yardımı", type: "money" },
      { key: "BuyukCocukYardimi", label: "Büyük Çocuk Yardımı", type: "money" },
      { key: "AileYardimi", label: "Aile Yardımı", type: "money" },
      { key: "KasaTazminati", label: "Kasa Tazminatı", type: "money" },
      { key: "IsRiskiYardimi", label: "İş Riski Yardımı", type: "money" },
      {
        key: "CesitliOdemelerYardimi",
        label: "Çeşitli Ödemeler Yardımı",
        type: "money",
      },
      { key: "PrimOdemeYardimi", label: "Prim Ödeme Yardımı", type: "money" },
      { key: "EkMenfaatYardimi", label: "Ek Menfaat Yardımı", type: "money" },
      { key: "YillikIzinYardimi", label: "Yıllık İzin Yardımı", type: "money" },
      {
        key: "HastalikRiskYardimi",
        label: "Hastalık Risk Yardımı",
        type: "money",
      },
      { key: "YolUcreti", label: "Yol Ücreti", type: "money" },
      { key: "KresYardimi", label: "Kreş Yardımı", type: "money" },
      { key: "ArabulucuYardimi", label: "Arabulucu Yardımı", type: "money" },
      { key: "KidemTazminati", label: "Kıdem Tazminatı", type: "money" },
      { key: "IhbarTazminati", label: "İhbar Tazminatı", type: "money" },
    ],
  },
  {
    key: "kesinti",
    title: "Kesintiler",
    icon: CircleMinus,
    fields: [
      { key: "SendikaKesintisi", label: "Sendika Kesintisi", type: "money" },
      { key: "AvansKesintisi", label: "Avans Kesintisi", type: "money" },
      { key: "IcraKesintisi", label: "İcra Kesintisi", type: "money" },
      {
        key: "KalanIcraKesintisi",
        label: "Kalan İcra Kesintisi",
        type: "money",
      },
      { key: "NafakaKesintisi", label: "Nafaka Kesintisi", type: "money" },
      { key: "TelefonKesintisi", label: "Telefon Kesintisi", type: "money" },
      { key: "EgitimKesintisi", label: "Eğitim Kesintisi", type: "money" },
      { key: "TrafikKesintisi", label: "Trafik Kesintisi", type: "money" },
      { key: "HasarKesintisi", label: "Hasar Kesintisi", type: "money" },
      {
        key: "FazlaOdemeKesintisi",
        label: "Fazla Ödeme Kesintisi",
        type: "money",
      },
      { key: "SayistayKesintisi", label: "Sayıştay Kesintisi", type: "money" },
      { key: "MuhtelifKesintisi", label: "Muhtelif Kesintisi", type: "money" },
      { key: "YevmiyeKesintisi", label: "Yevmiye Kesintisi", type: "money" },
      {
        key: "DayanismaKesintisi",
        label: "Dayanışma Kesintisi",
        type: "money",
      },
      { key: "LojmanKesintisi", label: "Lojman Kesintisi", type: "money" },
      {
        key: "GecmisDonemOdemeKesintisi",
        label: "Geçmiş Dönem Ödeme K.",
        type: "money",
      },
      { key: "IsAvansiKesintisi", label: "İş Avansı Kesintisi", type: "money" },
      { key: "KresKesintisi", label: "Kreş Kesintisi", type: "money" },
      {
        key: "PostaPuluKesintisi",
        label: "Posta Pulu Kesintisi",
        type: "money",
      },
      { key: "DisiplinKesintisi", label: "Disiplin Kesintisi", type: "money" },
      {
        key: "FazlaKesilenBesTutari",
        label: "Fazla Kesilen BES",
        type: "money",
      },
      {
        key: "EksikKesilenBesKesintisi",
        label: "Eksik Kesilen BES",
        type: "money",
      },
      { key: "Bes", label: "BES Tutarı", type: "money" },
      { key: "BesOrani", label: "BES Oranı", type: "percent" },
      {
        key: "YasalKesintilerToplami",
        label: "Yasal Kesintiler Toplamı",
        type: "money",
      },
    ],
  },
  {
    key: "odeme",
    title: "Ödeme ve Vergi Bilgileri",
    icon: Banknote,
    fields: [
      { key: "ToplamYemek", label: "Yemek Günü", type: "number" },
      { key: "BrutToplamYemek", label: "Yemek Brüt", type: "money" },
      { key: "ToplamYol", label: "Yol Günü", type: "number" },
      { key: "BrutToplamYol", label: "Yol Brüt", type: "money" },
      { key: "YemekUcreti", label: "Yemek Ücreti", type: "money" },
      { key: "YolYemekUcreti", label: "Yol Yemek Ücreti", type: "money" },
      { key: "BrutToplamYolYemek", label: "Brüt Yol Yemek", type: "money" },
      { key: "BrutGunOdemeler", label: "Brüt Gün Ödemeler", type: "money" },
      { key: "BrutMesaiOdemeler", label: "Brüt Mesai Ödemeler", type: "money" },
      {
        key: "BrutYardimOdemeler",
        label: "Brüt Yardım Ödemeler",
        type: "money",
      },
      {
        key: "BrutToplamOdemeler",
        label: "Brüt Toplam Ödemeler",
        type: "money",
      },
      { key: "SgkMatrahi", label: "SGK Matrahı", type: "money" },
      { key: "SgkIsciPrimi", label: "SGK İşçi Primi", type: "money" },
      { key: "SgkIsverenPrimi", label: "SGK İşveren Primi", type: "money" },
      {
        key: "SgkIssizIsciPrimi",
        label: "SGK İşsiz İşçi Primi",
        type: "money",
      },
      {
        key: "SgkIssizIsverenPrimi",
        label: "SGK İşsiz İşveren Primi",
        type: "money",
      },
      {
        key: "KumulatifVergiMatrahi",
        label: "Kümülatif Vergi Matrahı",
        type: "money",
      },
      { key: "VergiMatrahi", label: "Vergi Matrahı", type: "money" },
      { key: "DamgaVergisi", label: "Damga Vergisi", type: "money" },
      {
        key: "DamgaVergisiMatrahi",
        label: "Damga Vergisi Matrahı",
        type: "money",
      },
      { key: "GelirVergisi", label: "Gelir Vergisi", type: "money" },
      {
        key: "IndirimSonrasiVergiMatrahi",
        label: "İndirim Sonrası V.M.",
        type: "money",
      },
      { key: "VergiIndirimi", label: "Vergi İndirimi", type: "money" },
      { key: "PersonelIndirimi", label: "Personel İndirimi", type: "money" },
      { key: "NetOdenen", label: "Net Ödenen", type: "money" },
      { key: "OdenecekTutar", label: "Ödenecek Tutar", type: "money" },
      { key: "AuGelirVergisiMatrahi", label: "A.Ü. Gelir Vergisi Matrahı", type: "money" },
      { key: "NetMesaiOdemeler", label: "Net Mesai Ödemeler", type: "money" },
      { key: "ToplamDiger", label: "Toplam Diğer", type: "money" },
    ],
  },
  {
    key: "tesvik",
    title: "Teşvik Bilgileri",
    icon: Percent,
    fields: [
      { key: "Tesvik5510", label: "Teşvik 5510", type: "money" },
      { key: "Tesvik4447", label: "Teşvik 4447", type: "money" },
      { key: "Tesvik", label: "Teşvik", type: "money" },
    ],
  },
];

/** Görünüm modundan bağımsız, sıfır olsa bile hep gösterilen toplamlar. */
export const SUMMARY_TOTAL_FIELDS: {
  key: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "NetOdenen", label: "Net Ödenen", icon: CircleCheck },
  { key: "KesintilerToplami", label: "Kesintiler Toplamı", icon: CircleMinus },
  { key: "OdenecekTutar", label: "Ödenecek Tutar", icon: Wallet },
  { key: "ToplamMaliyet", label: "Toplam Maliyet", icon: TrendingUp },
];

export const formatTL = (value: unknown) =>
  `${formatMoney(value as number | string | null | undefined)} ₺`;

/** Ekranda gösterilecek değer. Boolean'lar ekranda ikonla çizilir. */
export function toFieldValue(
  value: unknown,
  type: RaporFieldType,
): SectionExportFieldValue {
  switch (type) {
    case "money":
      return formatTL(value);
    case "percent":
      return `%${Number(value ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
    case "number":
      return Number(value ?? 0).toLocaleString("tr-TR", {
        maximumFractionDigits: 2,
      });
    case "boolean":
      return Boolean(value);
    default:
      return value === null || value === undefined || value === ""
        ? null
        : String(value);
  }
}

// Sayısal alanlarda sıfır "bakiye yok" sayılır; metin/boolean alanlar filtrelenmez.
const isEmptyBakiye = (value: unknown, type: RaporFieldType) => {
  if (type !== "money" && type !== "number" && type !== "percent") return false;
  if (value === null || value === undefined || value === "") return true;
  return Number(value) === 0;
};

/** Ekran ve dışa aktarım aynı kuralla filtrelensin diye ortak. */
export const getVisibleFields = (
  fields: RaporField[],
  values: RaporValues,
  showEmpty: boolean,
) =>
  showEmpty
    ? fields
    : fields.filter((f) => !isEmptyBakiye(values[f.key], f.type));

/**
 * Logs alanı "<br/>" ile ayrılmış HTML geliyor. innerHTML yerine DOMParser
 * (script çalıştırmaz, kaynak yüklemez) ile düz metin satırlarına çevrilir.
 */
export function parseLogLines(rows: { Logs: string | null }[]) {
  const html = rows
    .map((row) => row?.Logs ?? "")
    .filter(Boolean)
    .join("<br/>");
  if (!html) return [];

  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  const plain =
    typeof DOMParser !== "undefined"
      ? (new DOMParser().parseFromString(withBreaks, "text/html").body
          .textContent ?? "")
      : withBreaks.replace(/<[^>]*>/g, "");

  return plain.split("\n").map((line) => line.trim());
}
