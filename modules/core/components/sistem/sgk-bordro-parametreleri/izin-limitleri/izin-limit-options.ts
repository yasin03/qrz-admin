import { IzinLimitNitelik } from "@/modules/core/types/sistem/sgk-bordro";

export const NITELIK_OPTIONS: { value: IzinLimitNitelik; label: string }[] = [
  { value: "YIL", label: "Yıl" },
  { value: "YAŞ", label: "Yaş" },
];

/** Response'taki Nitelik'i (büyük/küçük harf, "YAS" yazımı) YIL/YAŞ'a çevirir. */
export function toNitelikValue(nitelik: string): IzinLimitNitelik {
  return nitelik?.trim().toLocaleUpperCase("tr-TR").startsWith("YA")
    ? "YAŞ"
    : "YIL";
}

export function getNitelikLabel(nitelik: string) {
  const value = toNitelikValue(nitelik);
  return NITELIK_OPTIONS.find((o) => o.value === value)?.label ?? nitelik;
}
