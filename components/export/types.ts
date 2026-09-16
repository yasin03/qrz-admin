export interface ExportColumn<T> {
  /** Export edilen dosyada görünecek sütun başlığı */
  header: string;
  /** Satırdan değeri okumak için: doğrudan alan adı ya da hesaplayan bir fonksiyon */
  accessorKey: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

export type ExportFormat = "pdf" | "docx" | "xlsx" | "report";

export type ExportOrientation = "portrait" | "landscape";

export interface ExportMeta {
  title?: string;
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
}

/** Bir satırdan export değerini okuyup görüntülenecek string'e çevirir */
export function getExportValue<T>(row: T, col: ExportColumn<T>): string {
  const value =
    typeof col.accessorKey === "function" ? col.accessorKey(row) : row[col.accessorKey];

  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
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