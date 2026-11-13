/**
 * Tüm export belgelerinin (PDF tablo, bölümlü PDF, Word, Excel) ortak renk
 * paleti — belgeler aynı kurumsal görünümü paylaşsın diye tek yerde.
 */
export const PRIMARY = "#1F4E79";
export const PRIMARY_SOFT = "#EAF1F8";
export const BORDER = "#D9DEE5";
export const MUTED = "#6B7280";
export const TEXT = "#111827";
/** Tablo satırlarında zebra zemin */
export const ROW_ALT = "#F7F9FC";

/** Word/Excel için "#" olmadan hex (Excel'de başına "FF" alfa eklenir) */
export const hex = (color: string) => color.replace("#", "").toUpperCase();
export const argb = (color: string) => `FF${hex(color)}`;
