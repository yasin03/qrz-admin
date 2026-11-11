import { KidemIhbarTip } from "@/modules/core/types/sistem/sgk-bordro";

export const TIP_OPTIONS: { value: KidemIhbarTip; label: string }[] = [
  { value: "İhbar", label: "İhbar" },
  { value: "Kıdem", label: "Kıdem" },
];

/** Response'taki Tip'i (büyük/küçük harf, "IHBAR"/"KIDEM" yazımı) İhbar/Kıdem'e çevirir. */
export function toTipValue(tip: string): KidemIhbarTip {
  return tip?.trim().toLocaleUpperCase("tr-TR").startsWith("K")
    ? "Kıdem"
    : "İhbar";
}
