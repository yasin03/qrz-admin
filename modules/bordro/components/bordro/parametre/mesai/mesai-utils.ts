import { normalize } from "@/lib/utils";
import type { SelectOption } from "@/types/form";

export type MesaiBirim = "GUN" | "SAAT";

export const MESAI_MAX_SAAT = 24;

/**
 * Mesai tipinin gün mü saat mi olduğunu ADINDAN çıkarır
 * ("FAZLA MESAI GÜN %100" → GUN, "FAZLA MESAI SAAT %50" → SAAT). Kod ile
 * değil ad ile bakıyoruz, sabit tanım kodları ortamdan ortama değişebilir.
 */
export function getMesaiBirim(text?: string | null): MesaiBirim | undefined {
  const value = normalize(text);
  if (value.includes("saat")) return "SAAT";
  if (value.includes("gun")) return "GUN";
  return undefined;
}

/**
 * Mesai tipi seçeneklerinin değeri olarak kod ("20") kullanılıyor; API
 * MesaiTipi'ni kod olarak bekliyor.
 */
export function toMesaiTipiOptions(mesaiTipleri: SelectOption[]) {
  return mesaiTipleri.map((tip) => ({
    value: String(tip.kod ?? tip.value),
    label: tip.label,
  }));
}

/**
 * API'ye giden Deger:
 *   - Gün  + Brüt → "1" (sabit, değiştirilemez)
 *   - Gün  + Net  → tutar
 *   - Saat + Brüt → saat (en fazla 24)
 *   - Saat + Net  → tutar
 */
export function isGunBrut(birim: MesaiBirim | undefined, net: boolean) {
  return birim === "GUN" && !net;
}
