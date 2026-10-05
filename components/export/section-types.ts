// Tablo (grid) olmayan, "bölüm bölüm" alan/değer şeklindeki sayfaların
// (ör. Özlük Bilgileri) export'u için ortak veri modeli. Sayfa bu modeli
// ekranda gösterdiği haliyle (filtre uygulanmış) doldurur; PDF/Word/Excel
// exporter'ları aynı modeli kendi formatında çizer.

export type SectionExportFieldValue = string | boolean | null;

export type SectionExportField = {
  label: string;
  value: SectionExportFieldValue;
  /** Satırın tamamını kaplasın (adres, IBAN, açıklama gibi uzun değerler) */
  span?: boolean;
};

export type SectionExportSection = {
  title: string;
  fields: SectionExportField[];
};

export type SectionExportDocument = {
  /** Belge başlığı, ör. "Personel Özlük Bilgileri" */
  title: string;
  /** Profil bloğu: büyük başlık (ör. Ad Soyad) */
  heading: string;
  /** Başlığın altındaki açıklama (ör. unvan) */
  subheading?: string | null;
  /** Profil bloğundaki kısa etiketler (ör. Aktif, Kadın, 32 yaş) */
  tags?: string[];
  /** Özet kutuları (ör. Sicil No, İşe Giriş, Kıdem, Ücret) */
  summary?: { label: string; value: string }[];
  sections: SectionExportSection[];
};

export type SectionExportFormat = "pdf" | "docx" | "xlsx";

/** Alan değerini belgede gösterilecek metne çevirir */
export function formatSectionValue(value: SectionExportFieldValue): string {
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return value ?? "-";
}

/** Export tarihini "dd.MM.yyyy HH:mm" olarak döner */
export function getExportDateLabel(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Alanları belgede yan yana iki alan olacak şekilde satırlara böler.
 * span alanlar tek başına bir satır kaplar.
 */
export function chunkSectionFields(
  fields: SectionExportField[],
): SectionExportField[][] {
  const rows: SectionExportField[][] = [];
  let current: SectionExportField[] = [];

  for (const field of fields) {
    if (field.span) {
      if (current.length) rows.push(current);
      rows.push([field]);
      current = [];
      continue;
    }
    current.push(field);
    if (current.length === 2) {
      rows.push(current);
      current = [];
    }
  }
  if (current.length) rows.push(current);
  return rows;
}
