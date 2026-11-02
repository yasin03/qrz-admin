import { AY_DATA } from "@/constants/data";
import { formatMoney } from "@/lib/format";
import {
  KatsayiOranDegerleri,
  KatsayiOranType,
} from "@/types/sistem/sgk-bordro";

type AlanTipi = "money" | "oran" | "yuzde";

/** Form, tablo ve export kolonları bu listeden üretilir. Sıra proc ile aynı. */
export const KATSAYI_ALANLARI: {
  key: keyof KatsayiOranDegerleri;
  label: string;
  tip: AlanTipi;
}[] = [
  { key: "DamgaVergisi", label: "Damga Vergisi Oranı", tip: "oran" },
  { key: "SskGunlukTaban", label: "SSK Günlük Taban", tip: "money" },
  { key: "SskGunlukTavan", label: "SSK Günlük Tavan", tip: "money" },
  { key: "SskAylikTaban", label: "SSK Aylık Taban", tip: "money" },
  { key: "SskAylikTavan", label: "SSK Aylık Tavan", tip: "money" },
  {
    key: "DamgaVergisiIstisnasi",
    label: "Damga Vergisi İstisnası",
    tip: "money",
  },
  {
    key: "AuGelirVergisiMatrahi",
    label: "AÜ Gelir Vergisi Matrahı",
    tip: "money",
  },
  {
    key: "GelirVergisiIstisnasi",
    label: "Gelir Vergisi İstisnası",
    tip: "money",
  },
  {
    key: "SgkIssizIsverenPrimiOran",
    label: "SGK İşsizlik İşveren Primi",
    tip: "yuzde",
  },
  { key: "EmekliNet", label: "Emekli Net", tip: "money" },
];

/** money → "33.030,00", oran → "0,00759", yuzde → "%2" */
export function formatKatsayiDeger(
  tip: AlanTipi,
  value: number | string | null | undefined,
) {
  if (value === null || value === undefined || value === "") return "";
  if (tip === "money") return formatMoney(value);

  const sayi = Number(value).toLocaleString("tr-TR", {
    maximumFractionDigits: 6,
  });
  return tip === "yuzde" ? `%${sayi}` : sayi;
}

/** "2" / "02" → "Şubat" */
export function getAyAdi(ay: KatsayiOranType["Ay"]) {
  const value = String(ay ?? "").padStart(2, "0");
  return AY_DATA.find((item) => item.value === value)?.label ?? String(ay);
}

export function toAyValue(ay: KatsayiOranType["Ay"]) {
  return String(ay ?? "").padStart(2, "0");
}
