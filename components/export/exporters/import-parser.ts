import ExcelJS from "exceljs";

/** Excel dosyasını okuyup ilk satırı başlık kabul ederek satır dizisine çevirir */
export async function parseExcelFile(
  file: File,
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? `col_${colNumber}`);
  });

  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // başlık satırını atla
    const record: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber - 1] ?? `col_${colNumber}`;
      record[key] = cell.value;
    });
    rows.push(record);
  });

  return rows;
}

/**
 * PDF import "best effort" bir metin çıkarımıdır: pdfjs-dist yalnızca sayfadaki
 * metin akışını (kelime/konum listesini) verir, bizim ürettiğimiz PDF'lerdeki
 * tablo hücrelerini garanti şekilde satır/sütuna ayırmaz. Gerçek veri girişi
 * için Excel formatını önermek çok daha güvenilir; PDF import'u burada sayfa
 * bazlı ham metin döndürecek şekilde bırakıldı, parent tarafında ihtiyaca göre
 * ayrıca işlenmesi gerekir.
 */
export async function parsePdfFile(
  file: File,
): Promise<Record<string, unknown>[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: buffer }).promise;

  const rows: Record<string, unknown>[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (text) rows.push({ sayfa: pageNumber, metin: text });
  }

  return rows;
}

export async function parseImportFile(
  file: File,
): Promise<Record<string, unknown>[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") return parseExcelFile(file);
  if (extension === "pdf") return parsePdfFile(file);
  throw new Error(
    "Desteklenmeyen dosya formatı: yalnızca .xlsx ve .pdf içe aktarılabilir",
  );
}
