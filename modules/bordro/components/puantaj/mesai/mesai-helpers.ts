import type { MesaiCizelgesiSelectResponseType } from "@/modules/bordro/types/puantaj";

/**
 * Mesai hücre değerini satırlara böler: "FMS.100 3.0" → ["FMS.100", "3.0"].
 * Boş ya da sıfır değerde boş dizi döner.
 */
export function mesaiParcalari(value: string | null | undefined): string[] {
  const trimmed = value?.toString().trim();
  if (!trimmed || Number(trimmed) === 0) return [];
  return trimmed.split(/\s+/);
}

/** Toplam hücreleri için: boş/sıfır ise "". */
export function formatToplam(value: string | null | undefined): string {
  const trimmed = value?.toString().trim();
  if (!trimmed || Number(trimmed) === 0) return "";
  return trimmed;
}

export const MESAI_TOPLAM_ALANLARI: {
  key: keyof MesaiCizelgesiSelectResponseType;
  header: string;
  title: string;
}[] = [
  { key: "ToplamFM", header: "FM", title: "Fazla Mesai" },
  { key: "ToplamRM", header: "RM", title: "Resmi Tatil Mesaisi" },
  { key: "ToplamDM", header: "DM", title: "Diğer Mesai" },
  { key: "ToplamFMG", header: "FMG", title: "Fazla Mesai (Gün)" },
  { key: "ToplamRMG", header: "RMG", title: "Resmi Tatil Mesaisi (Gün)" },
  { key: "ToplamDMG", header: "DMG", title: "Diğer Mesai (Gün)" },
  { key: "ToplamTisFM", header: "TİS FM", title: "TİS Fazla Mesai" },
  { key: "ToplamTisFMG", header: "TİS FMG", title: "TİS Fazla Mesai (Gün)" },
  { key: "ToplamTisGs", header: "TİS GS", title: "TİS GS" },
  { key: "ToplamTisGg", header: "TİS GG", title: "TİS GG" },
];
