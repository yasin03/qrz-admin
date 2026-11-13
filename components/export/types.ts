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
  /** Hizalama; verilmezse sayı/para sağa, diğerleri sola (bkz. getExportAlign) */
  align?: ExportAlign;
}

export type ExportAlign = "left" | "center" | "right";

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

/** Kolonun başlık + hücre hizası: align verilmişse o, yoksa sayılar sağa */
export const getExportAlign = <T,>(col: ExportColumn<T>): ExportAlign =>
  col.align ?? (isNumericExportColumn(col) ? "right" : "left");

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

/**
 * "Toplam" yazısının konacağı kolon: toplamı olmayan ilk metin kolonu
 * (dar "#" sıra no kolonuna yazılmasın); yoksa toplamı olmayan ilk kolon.
 */
export function getTotalLabelIndex<T>(
  totals: (number | null)[],
  columns: ExportColumn<T>[],
) {
  const textIndex = totals.findIndex(
    (total, i) => total === null && !isNumericExportColumn(columns[i]),
  );
  return textIndex !== -1 ? textIndex : totals.findIndex((total) => total === null);
}

/** Toplam satırının belgelerde (PDF/Word) görünecek metinleri; ilk boş hücreye "Toplam" yazılır */
export function getExportTotalLabels<T>(
  totals: (number | null)[],
  columns: ExportColumn<T>[],
): string[] {
  const labels = totals.map((total, i) => {
    if (total === null) return "";
    return columns[i].format === "money"
      ? `${formatMoney(total)}\u00A0₺`
      : total.toLocaleString("tr-TR");
  });
  const labelIndex = getTotalLabelIndex(totals, columns);
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
    // Bölünmez boşluk: "₺" tablolarda tutardan ayrılıp alt satıra kaymasın
    return numeric === null ? String(value) : `${formatMoney(numeric)}\u00A0₺`;
  }
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (value instanceof Date) {
    return `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`;
  }
  if (typeof value === "string") return formatIsoDate(value) ?? value;
  return String(value);
}

const MAX_UNBREAKABLE = 14;

/**
 * Bir kelimenin yaklaşık genişliği (em). Büyük harfler rakam/küçük harften
 * belirgin geniş; hepsini aynı saymak "ÇALISIYOR" gibi kelimeleri böldürüyordu.
 */
function wordWidthEm(word: string) {
  let width = 0;
  for (const char of word.slice(0, MAX_UNBREAKABLE)) {
    if (/[.,:;'!|ıIil]/.test(char)) width += 0.3;
    else if (char !== char.toLocaleLowerCase("tr-TR")) width += 0.7;
    else width += 0.55;
  }
  return width;
}

// Yalnızca normal boşluktan bölünür; bölünmez boşluk (\u00A0, örn. "3.500,00 ₺")
// kelimenin parçası sayılır — JS'teki \s onu da boşluk kabul ediyor.
const splitWords = (text: string) => text.split(/[ \t\r\n]+/);

const longestWord = (text: string) =>
  Math.max(0, ...splitWords(text).map((word) => word.length));

const widestWordEm = (text: string) =>
  Math.max(0, ...splitWords(text).map(wordWidthEm));

/**
 * Kolon genişliklerini içeriğe göre hesaplamak için (PDF ve Word):
 * - unbreakableEm: başlığın ve verinin bölünemeyen en geniş kelimesinin
 *   genişliği (em; 14 karaktere kadar — TC, telefon, tarih, tutar tek
 *   satıra sığsın). Yazı boyutuyla çarpılınca pt verir.
 * - weight: kalan genişliğin paylaşım oranı; verinin tipik (90. yüzdelik)
 *   uzunluğu. Uzun serbest metinler 32 ile sınırlanır, alt satıra kayar.
 * Eşit genişlikte kolonlarda TC No gibi değerler yan hücreye taşıyordu.
 */
export function measureExportColumns<T>(data: T[], columns: ExportColumn<T>[]) {
  const sample = data.slice(0, 300);

  return columns.map((col) => {
    const values = sample.map((row) => getExportValue(row, col));
    const lengths = values.map((v) => v.length).sort((a, b) => a - b);
    const typical = lengths.length
      ? lengths[Math.min(lengths.length - 1, Math.floor(lengths.length * 0.9))]
      : 0;
    const unbreakable = Math.max(
      longestWord(col.header),
      Math.min(Math.max(0, ...values.map(longestWord)), MAX_UNBREAKABLE),
    );
    const unbreakableEm = Math.max(
      widestWordEm(col.header),
      ...values.map(widestWordEm),
    );
    return {
      unbreakableEm,
      weight: Math.min(Math.max(unbreakable, typical, 4), 32),
    };
  });
}

/**
 * Kolonların başına 1'den başlayan sıra no ("#") kolonu ekler. Numara,
 * export edilen (filtrelenmiş) listedeki sıraya göredir.
 */
export function withRowNumbers<T>(
  data: T[],
  columns: ExportColumn<T>[],
): ExportColumn<T>[] {
  const rowNumbers = new Map<T, number>();
  data.forEach((row, index) => rowNumbers.set(row, index + 1));

  return [
    {
      header: "#",
      accessorKey: (row) => rowNumbers.get(row) ?? null,
      format: "number",
      align: "center",
    },
    ...columns,
  ];
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