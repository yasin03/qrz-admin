import { formatMoney } from "@/lib/format";

export interface ExportColumn<T> {
  /** Export edilen dosyada görünecek sütun başlığı */
  header: string;
  /** Satırdan değeri okumak için: doğrudan alan adı ya da hesaplayan bir fonksiyon */
  accessorKey: keyof T | ((row: T) => string | number | boolean | Date | null | undefined);
  /**
   * "money": değer "3.500,00 ₺" şeklinde, Excel'de sayısal para formatında yazılır.
   * "number": Excel'de sayı hücresi olarak yazılır, belgelerde sağa hizalanır.
   * "date": değer Date olmalı; belgelerde "dd.MM.yyyy", Excel'de tarih hücresi olarak yazılır.
   */
  format?: "money" | "number" | "date";
  /** true verilirse ("money"/"number" kolonlarında) tablonun sonuna toplam satırı eklenir */
  total?: boolean;
}

export type ExportFormat = "pdf" | "docx" | "xlsx" | "report";

export type ExportOrientation = "portrait" | "landscape";

export interface ExportMeta {
  title?: string;
  /** Başlığın altına yazılan ek bilgi (tarih aralığı, şube vb.) */
  subtitle?: string;
  fileName?: string;
  orientation?: ExportOrientation;
}

export interface ExportMenuProps<T> {
  /** Export edilecek veri (mevcut filtrelenmiş/sayfalanmış liste) */
  data: T[];
  /**
   * Export'a özel kolon tanımı. Tablo kolonlarından (react-table) bağımsızdır;
   * her sayfa kendi export sütunlarını burada tanımlar.
   */
  exportColumns: ExportColumn<T>[];
  /** Belgenin başlığı — verilmezse "Rapor" kullanılır */
  title?: string;
  /** Başlığın altına yazılan ek bilgi (tarih aralığı, şube vb.) */
  subtitle?: string;
  /** İndirilecek dosya adı (uzantısız) — verilmezse "rapor" kullanılır */
  fileName?: string;
  /**
   * Başlangıç yönlendirmesi. Kullanıcı yine de menüden değiştirebilir.
   * Verilmezse kolon sayısına göre otomatik seçilir (6'dan fazla kolon → yatay).
   */
  defaultOrientation?: ExportOrientation;
  /** İçe aktar seçeneğini bu sayfada göster/gizle */
  showImport?: boolean;
  /** İçe aktarılan dosyadan okunan satırlar buradan parent'a döner */
  onImport?: (rows: Record<string, unknown>[]) => void;
  /**
   * Verilirse "İçe aktar" dosya seçiciyi açmak yerine bunu çağırır;
   * sayfa kendi import dialog'unu yönetir (onImport kullanılmaz).
   */
  onImportClick?: () => void;
}

/** Bir satırdan export kolonunun ham (formatlanmamış) değerini okur */
export function getExportRawValue<T>(row: T, col: ExportColumn<T>): unknown {
  return typeof col.accessorKey === "function"
    ? col.accessorKey(row)
    : row[col.accessorKey];
}

/** Para/sayı kolonları için sayısal değeri döner; boş/geçersizse null */
export function getExportMoneyValue<T>(row: T, col: ExportColumn<T>): number | null {
  const value = getExportRawValue(row, col);
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

export const isNumericExportColumn = <T,>(col: ExportColumn<T>) =>
  col.format === "money" || col.format === "number";

/**
 * `total: true` olan kolonların toplamını döner (kolon sırasıyla; toplamı
 * olmayan kolonlar null). Hiçbir kolonda total yoksa null döner.
 */
export function getExportTotals<T>(data: T[], columns: ExportColumn<T>[]): (number | null)[] | null {
  if (!columns.some((col) => col.total && isNumericExportColumn(col))) return null;

  return columns.map((col) => {
    if (!col.total || !isNumericExportColumn(col)) return null;
    return data.reduce((sum, row) => sum + (getExportMoneyValue(row, col) ?? 0), 0);
  });
}

/** Toplam satırının belgelerde (PDF/Word) görünecek metinleri; ilk boş hücreye "Toplam" yazılır */
export function getExportTotalLabels<T>(
  totals: (number | null)[],
  columns: ExportColumn<T>[],
): string[] {
  const labels = totals.map((total, i) => {
    if (total === null) return "";
    return columns[i].format === "money"
      ? `${formatMoney(total)} ₺`
      : total.toLocaleString("tr-TR");
  });
  const labelIndex = labels.findIndex((label) => label === "");
  if (labelIndex !== -1) labels[labelIndex] = "Toplam";
  return labels;
}

// "2026-04-22", "2026-04-22T00:00:00.000Z", "2026-04-22 08:30:00" gibi ISO tarihleri yakalar
const ISO_DATE_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

/**
 * ISO tarih string'ini "dd.MM.yyyy" (saat 00:00 değilse "dd.MM.yyyy HH:mm")
 * formatına çevirir. Veritabanı yerel saati "Z" ile gönderdiği için Date'e
 * çevirmeden parçalardan okunur; aksi halde saat dilimi kayması olurdu.
 */
function formatIsoDate(value: string): string | null {
  const match = ISO_DATE_REGEX.exec(value.trim());
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const date = `${day}.${month}.${year}`;
  const hasTime = hour !== undefined && !(hour === "00" && minute === "00");
  return hasTime ? `${date} ${hour}:${minute}` : date;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Bir satırdan export değerini okuyup görüntülenecek string'e çevirir */
export function getExportValue<T>(row: T, col: ExportColumn<T>): string {
  const value = getExportRawValue(row, col);

  if (value === null || value === undefined) return "";
  if (col.format === "money") {
    const numeric = getExportMoneyValue(row, col);
    return numeric === null ? String(value) : `${formatMoney(numeric)} ₺`;
  }
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (value instanceof Date) {
    return `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`;
  }
  if (typeof value === "string") return formatIsoDate(value) ?? value;
  return String(value);
}

/** Export belgelerinin başlığın altına yazdığı kayıt sayısı metni */
export function getRecordCountLabel(count: number) {
  return `Toplam Kayıt: ${count.toLocaleString("tr-TR")}`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}