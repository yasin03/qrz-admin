import { ExportColumn, ExportMeta, getExportValue } from "../types";

/**
 * Yer tutucu: "Rapor" formatı şimdilik dosya üretmiyor, seçilen veriyi (export
 * kolonlarına göre formatlanmış haliyle) konsola yazdırıyor. İleride bunun
 * yerine bir rapor görünümü/route'u devreye alınabilir — imza aynı kalır,
 * sadece bu fonksiyonun içi değişir.
 */
export function exportToReport<T>(
  data: T[],
  columns: ExportColumn<T>[],
  meta: ExportMeta,
) {
  const rows = data.map((row) => {
    const record: Record<string, string> = {};
    columns.forEach((col) => {
      record[col.header] = getExportValue(row, col);
    });
    return record;
  });

  // eslint-disable-next-line no-console
  console.log(`[Rapor] ${meta.title ?? "Rapor"}`, rows);
}
