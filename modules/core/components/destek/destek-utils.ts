import type { DestekDosyaType } from "@/modules/core/types/destek";

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** API'den gelen jsonDosya'yı güvenli şekilde diziye çevirir. */
export function parseDosyalar(json: string | null | undefined) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? (parsed.filter((d) => d && d.fileName) as DestekDosyaType[])
      : [];
  } catch {
    return [];
  }
}

/** base64 içerikli dosyayı tarayıcıda indirir. */
export function downloadDosya(dosya: DestekDosyaType) {
  if (!dosya.base64) return;
  const bytes = Uint8Array.from(atob(dosya.base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes]));
  const link = document.createElement("a");
  link.href = url;
  link.download = dosya.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// Sadece emoji (ve aralarındaki boşluk / birleştiriciler) içeren metin.
const EMOJI_ONLY_RE =
  /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|\u200d|\ufe0f|\u20e3)+$/u;

/**
 * Mesaj yalnızca emojiden oluşuyorsa emoji sayısını, değilse 0 döner.
 * WhatsApp'taki gibi 1-3 emojilik mesajlar büyük gösteriliyor.
 */
export function emojiOnlyCount(text: string | null | undefined) {
  const value = text?.replace(/\s/g, "") ?? "";
  if (!value || !EMOJI_ONLY_RE.test(value)) return 0;
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(value)).length;
}
