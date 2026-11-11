import { HAFTA_DATA } from "@/constants/data";
import { TatilDurum, TatilResmiDini, TatilType } from "@/modules/core/types/sistem/sgk-bordro";

export const DURUM_OPTIONS: { value: TatilDurum; label: string }[] = [
  { value: "T", label: "Tam Gün" },
  { value: "Y", label: "Yarım Gün" },
];

export const RESMI_DINI_OPTIONS: { value: TatilResmiDini; label: string }[] = [
  { value: "Resmi", label: "Resmi" },
  { value: "Dini", label: "Dini" },
];

/** Select response'u Durum'u label olarak ("Tam Gün") döndüğü için T/Y'ye çevirir. */
export function toDurumValue(durum: string): TatilDurum {
  return durum?.trim().toLocaleLowerCase("tr-TR").startsWith("yar") ? "Y" : "T";
}

export function getGunAdi(row: TatilType) {
  return (
    HAFTA_DATA.find((item) => Number(item.value) === Number(row.Kodgun))
      ?.label ?? ""
  );
}
