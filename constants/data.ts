import { useMemo } from "react";

export const HAFTA_DATA = [
  {
    value: "1",
    label: "Pazartesi",
    en: "Monday",
    shortTr: "Pzt",
    shortEn: "Mon",
    isWeekend: false,
  },
  {
    value: "2",
    label: "Salı",
    en: "Tuesday",
    shortTr: "Sal",
    shortEn: "Tue",
    isWeekend: false,
  },
  {
    value: "3",
    label: "Çarşamba",
    en: "Wednesday",
    shortTr: "Çar",
    shortEn: "Wed",
    isWeekend: false,
  },
  {
    value: "4",
    label: "Perşembe",
    en: "Thursday",
    shortTr: "Per",
    shortEn: "Thu",
    isWeekend: false,
  },
  {
    value: "5",
    label: "Cuma",
    en: "Friday",
    shortTr: "Cum",
    shortEn: "Fri",
    isWeekend: false,
  },
  {
    value: "6",
    label: "Cumartesi",
    en: "Saturday",
    shortTr: "Cmt",
    shortEn: "Sat",
    isWeekend: false,
  },
  {
    value: "7",
    label: "Pazar",
    en: "Sunday",
    shortTr: "Paz",
    shortEn: "Sun",
    isWeekend: true,
  },
] as const;

export const AY_DATA = [
  { value: "01", label: "Ocak" },
  { value: "02", label: "Şubat" },
  { value: "03", label: "Mart" },
  { value: "04", label: "Nisan" },
  { value: "05", label: "Mayıs" },
  { value: "06", label: "Haziran" },
  { value: "07", label: "Temmuz" },
  { value: "08", label: "Ağustos" },
  { value: "09", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
] as const;

/**
 * Ölçü birimleri (teklif kalemleri vb.). Değer metin olarak saklanır
 * (ör. CrmTeklifKalem.Birim), bu yüzden value = label.
 */
export const BIRIM_DATA = [
  { value: "Adet", label: "Adet" },
  { value: "Saat", label: "Saat" },
  { value: "Gün", label: "Gün" },
  { value: "Hafta", label: "Hafta" },
  { value: "Ay", label: "Ay" },
  { value: "Yıl", label: "Yıl" },
  { value: "Kişi", label: "Kişi" },
  { value: "Paket", label: "Paket" },
  { value: "Kutu", label: "Kutu" },
  { value: "Set", label: "Set" },
  { value: "Kg", label: "Kg" },
  { value: "Gr", label: "Gr" },
  { value: "Ton", label: "Ton" },
  { value: "Lt", label: "Lt" },
  { value: "Metre", label: "Metre" },
  { value: "m²", label: "m²" },
  { value: "m³", label: "m³" },
] as const;

/** KDV oranları (%). Değer sayı olarak saklanır (ör. CrmTeklifKalem.KdvOrani). */
export const KDV_DATA = [
  { value: "0", label: "%0" },
  { value: "1", label: "%1" },
  { value: "10", label: "%10" },
  { value: "20", label: "%20" },
] as const;

/**
 * Para birimleri (teklif, satış, tahsilat). Değer ISO 4217 kodudur ve DB'de
 * char(3) olarak saklanır; CHECK kısıtlarındaki liste ile aynı olmalı
 * (sql/crm_teklif.sql, crm_satis.sql, crm_finans.sql).
 * Yeni birim eklenirse önce DB CHECK kısıtları güncellenir.
 */
export const PARA_BIRIMI_KODLARI = ["TRY", "USD", "EUR", "GBP"] as const;

export type ParaBirimi = (typeof PARA_BIRIMI_KODLARI)[number];

export const PARA_BIRIMI_DATA = [
  { value: "TRY", label: "TRY — Türk Lirası", sembol: "₺", ad: "Türk Lirası", adEn: "Turkish Lira" },
  { value: "USD", label: "USD — Amerikan Doları", sembol: "$", ad: "Amerikan Doları", adEn: "US Dollar" },
  { value: "EUR", label: "EUR — Euro", sembol: "€", ad: "Euro", adEn: "Euro" },
  { value: "GBP", label: "GBP — İngiliz Sterlini", sembol: "£", ad: "İngiliz Sterlini", adEn: "British Pound" },
] as const satisfies readonly { value: ParaBirimi; label: string; sembol: string; ad: string; adEn: string }[];

/** "USD" → "$". Bilinmeyen kodda kodun kendisi, boşta "". */
export const paraSembol = (pb: string | null | undefined) =>
  PARA_BIRIMI_DATA.find((p) => p.value === pb)?.sembol ?? pb ?? "";

export function useYearOptions(length = 10, futureYears = 0) {
  const currentYear = new Date().getFullYear();

  return useMemo(() => {
    const endYear = currentYear + futureYears;
    const startYear = endYear - length + 1;

    return Array.from({ length }, (_, index) => (startYear + index).toString());
  }, [length, futureYears, currentYear]);
}
