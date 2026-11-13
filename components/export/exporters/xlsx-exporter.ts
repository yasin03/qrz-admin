import ExcelJS from "exceljs";
import { getCompanyInfo, getLogoArrayBuffer, getCompanyContactLine } from "@/lib/company";
import {
  ExportColumn,
  ExportMeta,
  downloadBlob,
  getExportMoneyValue,
  getExportRawValue,
  getExportAlign,
  getExportTotals,
  getTotalLabelIndex,
  getExportValue,
  getRecordCountLabel,
  isNumericExportColumn,
} from "@/components/export/types";
import { BORDER, MUTED, PRIMARY, PRIMARY_SOFT, ROW_ALT, argb } from "./export-theme";

const solidFill = (color: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: argb(color) },
});

// Sayı olarak kalır (toplama/sıralama yapılabilir), Türkçe Excel'de "3.500,00 ₺" görünür
const MONEY_NUM_FMT = '#,##0.00 "₺"';
const DATE_NUM_FMT = "dd.mm.yyyy";

// exceljs Date'i UTC üzerinden seri numaraya çeviriyor; yerel gece yarısı
// (örn. UTC+3) bir önceki güne kaymasın diye aynı günün UTC karşılığını yazıyoruz.
const toExcelDate = (value: Date) =>
  new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));

export async function exportToXlsx<T>(
  data: T[],
  columns: ExportColumn<T>[],
  meta: ExportMeta,
) {
  const company = await getCompanyInfo();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet((meta.title ?? "Rapor").slice(0, 31));

  sheet.pageSetup.orientation = meta.orientation ?? "portrait";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;

  const colCount = Math.max(columns.length, 4);
  // Sadece key/width tanımlıyoruz — `header` set etmediğimiz için exceljs 1. satıra
  // otomatik başlık yazmıyor, o satırı şirket bilgisi için boş bırakıyor.
  // Genişlik içeriğe göre (başlık / en uzun değer), 8–40 karakter arası
  sheet.columns = columns.map((col) => {
    const longest = Math.max(
      col.header.length,
      ...data.slice(0, 300).map((row) => getExportValue(row, col).length),
    );
    return { key: col.header, width: Math.min(Math.max(longest + 2, 8), 40) };
  });

  const infoColSpan = Math.max(colCount - 2, 1);

  // Şirket bilgisi — sol üst
  sheet.mergeCells(1, 1, 1, infoColSpan);
  sheet.getCell(1, 1).value = company.name;
  sheet.getCell(1, 1).font = { bold: true, size: 13, color: { argb: argb(PRIMARY) } };

  if (company.address) {
    sheet.mergeCells(2, 1, 2, infoColSpan);
    sheet.getCell(2, 1).value = company.address;
    sheet.getCell(2, 1).font = { size: 10, color: { argb: argb(MUTED) } };
  }

  if (getCompanyContactLine(company)) {
    sheet.mergeCells(3, 1, 3, infoColSpan);
    sheet.getCell(3, 1).value = getCompanyContactLine(company);
    sheet.getCell(3, 1).font = { size: 10, color: { argb: argb(MUTED) } };
  }

  // Logo — sağ üst (yüklenemezse export'u engellemeden devam et)
  try {
    const logoBuffer = await getLogoArrayBuffer(company.logoPath);
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: colCount - 2, row: 0 },
      ext: { width: 120, height: 55 },
    });
  } catch {
    // logo yoksa sessizce geç
  }

  // Şirket bilgisinin altındaki lacivert çizgi (PDF ile aynı)
  for (let c = 1; c <= colCount; c++) {
    sheet.getCell(4, c).border = { bottom: { style: "medium", color: { argb: argb(PRIMARY) } } };
  }

  const titleRowIndex = 6;
  sheet.mergeCells(titleRowIndex, 1, titleRowIndex, colCount);
  const titleCell = sheet.getCell(titleRowIndex, 1);
  titleCell.value = meta.title ?? "Rapor";
  titleCell.font = { bold: true, size: 14 };

  // Alt başlık ve kayıt sayısı tek satırda: "01.01.2026 - 31.12.2026 · Tüm Şubeler · Toplam Kayıt: 40"
  const infoRowIndex = titleRowIndex + 1;
  sheet.mergeCells(infoRowIndex, 1, infoRowIndex, colCount);
  const infoCell = sheet.getCell(infoRowIndex, 1);
  infoCell.value = [meta.subtitle, getRecordCountLabel(data.length)]
    .filter(Boolean)
    .join(" · ");
  infoCell.font = { size: 10, color: { argb: argb(PRIMARY) } };

  const headerRowIndex = infoRowIndex + 2;
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: 10, color: { argb: argb(PRIMARY) } };
    cell.fill = solidFill(PRIMARY_SOFT);
    cell.border = { bottom: { style: "thin", color: { argb: argb(PRIMARY) } } };
    // Excel sayıları sağa yaslar; başlık da aynı hizada olsun
    cell.alignment = {
      vertical: "middle",
      wrapText: true,
      horizontal: getExportAlign(col),
    };
  });

  data.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex);
    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      cell.font = { size: 10 };
      cell.border = { bottom: { style: "hair", color: { argb: argb(BORDER) } } };
      if (rowIndex % 2 === 1) cell.fill = solidFill(ROW_ALT);
      // Açık hiza verilen kolonlar (örn. ortalı "#"); diğerlerinde Excel'in
      // doğal hizası (sayı/tarih sağda, metin solda) korunur
      if (col.align) cell.alignment = { horizontal: col.align };
      const numericValue = isNumericExportColumn(col)
        ? getExportMoneyValue(row, col)
        : null;
      const rawValue = getExportRawValue(row, col);

      if (numericValue !== null) {
        cell.value = numericValue;
        if (col.format === "money") cell.numFmt = MONEY_NUM_FMT;
      } else if (col.format === "date" && rawValue instanceof Date) {
        cell.value = toExcelDate(rawValue);
        cell.numFmt = DATE_NUM_FMT;
      } else {
        cell.value = getExportValue(row, col);
      }
    });
  });

  const totals = getExportTotals(data, columns);
  if (totals) {
    const totalRow = sheet.getRow(headerRowIndex + 1 + data.length);
    const labelIndex = getTotalLabelIndex(totals, columns);
    columns.forEach((col, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1);
      const total = totals[colIndex];
      if (total !== null) {
        cell.value = total;
        if (col.format === "money") cell.numFmt = MONEY_NUM_FMT;
      } else if (colIndex === labelIndex) {
        cell.value = "Toplam";
      }
      cell.font = { bold: true, size: 10, color: { argb: argb(PRIMARY) } };
      cell.fill = solidFill(PRIMARY_SOFT);
      cell.border = { top: { style: "thin", color: { argb: argb(PRIMARY) } } };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${meta.fileName ?? "rapor"}.xlsx`,
  );
}
