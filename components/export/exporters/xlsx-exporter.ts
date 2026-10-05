import ExcelJS from "exceljs";
import { getCompanyInfo, getLogoArrayBuffer } from "@/lib/company";
import {
  ExportColumn,
  ExportMeta,
  downloadBlob,
  getExportMoneyValue,
  getExportValue,
  getRecordCountLabel,
} from "../types";

// Sayı olarak kalır (toplama/sıralama yapılabilir), Türkçe Excel'de "3.500,00 ₺" görünür
const MONEY_NUM_FMT = '#,##0.00 "₺"';

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
  sheet.columns = columns.map((col) => ({ key: col.header, width: 22 }));

  const infoColSpan = Math.max(colCount - 2, 1);

  // Şirket bilgisi — sol üst
  sheet.mergeCells(1, 1, 1, infoColSpan);
  sheet.getCell(1, 1).value = company.name;
  sheet.getCell(1, 1).font = { bold: true, size: 13 };

  if (company.address) {
    sheet.mergeCells(2, 1, 2, infoColSpan);
    sheet.getCell(2, 1).value = company.address;
    sheet.getCell(2, 1).font = { size: 10, color: { argb: "FF555555" } };
  }

  if (company.phone) {
    sheet.mergeCells(3, 1, 3, infoColSpan);
    sheet.getCell(3, 1).value = company.phone;
    sheet.getCell(3, 1).font = { size: 10, color: { argb: "FF555555" } };
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

  const titleRowIndex = 5;
  sheet.mergeCells(titleRowIndex, 1, titleRowIndex, colCount);
  const titleCell = sheet.getCell(titleRowIndex, 1);
  titleCell.value = meta.title ?? "Rapor";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };

  const countCell = sheet.getCell(titleRowIndex + 1, 1);
  countCell.value = getRecordCountLabel(data.length);
  countCell.font = { size: 10, color: { argb: "FF555555" } };

  const headerRowIndex = titleRowIndex + 2;
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    };
    cell.border = { bottom: { style: "thin", color: { argb: "FF333333" } } };
  });

  data.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex);
    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      const moneyValue =
        col.format === "money" ? getExportMoneyValue(row, col) : null;

      if (moneyValue !== null) {
        cell.value = moneyValue;
        cell.numFmt = MONEY_NUM_FMT;
      } else {
        cell.value = getExportValue(row, col);
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${meta.fileName ?? "rapor"}.xlsx`,
  );
}
