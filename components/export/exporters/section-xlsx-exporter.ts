import ExcelJS from "exceljs";
import { getCompanyInfo, getLogoArrayBuffer } from "@/lib/company";
import { downloadBlob } from "../types";
import {
  SectionExportDocument,
  chunkSectionFields,
  formatSectionValue,
  getExportDateLabel,
} from "../section-types";

const PRIMARY = "FF1F4E79";
const PRIMARY_SOFT = "FFEAF1F8";
const LABEL_FILL = "FFF7F9FB";
const BORDER = "FFD9DEE5";
const MUTED = "FF6B7280";

const fill = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER } },
  bottom: { style: "thin", color: { argb: BORDER } },
  left: { style: "thin", color: { argb: BORDER } },
  right: { style: "thin", color: { argb: BORDER } },
};

// Etiket | Değer | Etiket | Değer
const COLUMN_COUNT = 4;

export async function exportSectionsToXlsx(
  doc: SectionExportDocument,
  fileName: string,
) {
  const company = await getCompanyInfo();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(doc.title.slice(0, 31), {
    views: [{ showGridLines: false }],
  });

  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.columns = [{ width: 26 }, { width: 32 }, { width: 26 }, { width: 32 }];

  let rowIndex = 1;
  const mergeRow = (row: number) => sheet.mergeCells(row, 1, row, COLUMN_COUNT);

  // ---- Şirket + belge başlığı ----
  sheet.mergeCells(rowIndex, 1, rowIndex, 2);
  const companyCell = sheet.getCell(rowIndex, 1);
  companyCell.value = company.name;
  companyCell.font = { bold: true, size: 13, color: { argb: PRIMARY } };

  sheet.mergeCells(rowIndex, 3, rowIndex, 4);
  const titleCell = sheet.getCell(rowIndex, 3);
  titleCell.value = doc.title;
  titleCell.font = { bold: true, size: 11, color: { argb: MUTED } };
  titleCell.alignment = { horizontal: "right" };
  rowIndex++;

  for (const line of [company.address, company.phone].filter(Boolean)) {
    sheet.mergeCells(rowIndex, 1, rowIndex, 2);
    const cell = sheet.getCell(rowIndex, 1);
    cell.value = line;
    cell.font = { size: 9, color: { argb: MUTED } };
    rowIndex++;
  }

  sheet.mergeCells(rowIndex, 3, rowIndex, 4);
  const dateCell = sheet.getCell(rowIndex, 3);
  dateCell.value = getExportDateLabel();
  dateCell.font = { size: 9, color: { argb: MUTED } };
  dateCell.alignment = { horizontal: "right" };
  for (let col = 1; col <= COLUMN_COUNT; col++) {
    sheet.getCell(rowIndex, col).border = {
      bottom: { style: "medium", color: { argb: PRIMARY } },
    };
  }
  rowIndex += 2;

  // Logo — sağ üst (yüklenemezse export'u engellemeden devam et)
  try {
    const logoBuffer = await getLogoArrayBuffer(company.logoPath);
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: 3, row: 0 },
      ext: { width: 120, height: 55 },
    });
  } catch {
    // logo yoksa sessizce geç
  }

  // ---- Profil ----
  mergeRow(rowIndex);
  const headingCell = sheet.getCell(rowIndex, 1);
  headingCell.value = doc.heading;
  headingCell.font = { bold: true, size: 16 };
  sheet.getRow(rowIndex).height = 24;
  rowIndex++;

  if (doc.subheading) {
    mergeRow(rowIndex);
    const cell = sheet.getCell(rowIndex, 1);
    cell.value = doc.subheading;
    cell.font = { size: 10, color: { argb: MUTED } };
    rowIndex++;
  }

  if (doc.tags?.length) {
    mergeRow(rowIndex);
    const cell = sheet.getCell(rowIndex, 1);
    cell.value = doc.tags.join("  ·  ");
    cell.font = { size: 9, color: { argb: PRIMARY } };
    rowIndex++;
  }
  rowIndex++;

  // ---- Özet kutuları (4 sütuna yayılır: etiket satırı + değer satırı) ----
  if (doc.summary?.length) {
    const labelRow = rowIndex;
    const valueRow = rowIndex + 1;
    doc.summary.slice(0, COLUMN_COUNT).forEach((item, i) => {
      const label = sheet.getCell(labelRow, i + 1);
      label.value = item.label.toLocaleUpperCase("tr-TR");
      label.font = { size: 8, color: { argb: MUTED } };
      label.fill = fill(PRIMARY_SOFT);

      const value = sheet.getCell(valueRow, i + 1);
      value.value = item.value;
      value.font = { bold: true, size: 12 };
      value.fill = fill(PRIMARY_SOFT);
    });
    sheet.getRow(valueRow).height = 22;
    rowIndex += 3;
  }

  // ---- Bölümler ----
  for (const section of doc.sections) {
    mergeRow(rowIndex);
    const header = sheet.getCell(rowIndex, 1);
    header.value = section.title;
    header.font = { bold: true, size: 11, color: { argb: PRIMARY } };
    header.fill = fill(PRIMARY_SOFT);
    header.border = { left: { style: "thick", color: { argb: PRIMARY } } };
    sheet.getRow(rowIndex).height = 20;
    rowIndex++;

    for (const row of chunkSectionFields(section.fields)) {
      const [first, second] = row;
      const cells = [1, 2, 3, 4].map((col) => sheet.getCell(rowIndex, col));

      cells[0].value = first.label;
      cells[1].value = formatSectionValue(first.value);
      if (first.span) {
        sheet.mergeCells(rowIndex, 2, rowIndex, COLUMN_COUNT);
      } else if (second) {
        cells[2].value = second.label;
        cells[3].value = formatSectionValue(second.value);
      }

      cells.forEach((cell, i) => {
        const isLabel = i % 2 === 0;
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.font = isLabel
          ? { size: 10, color: { argb: MUTED } }
          : { size: 10, bold: true };
        if (isLabel) cell.fill = fill(LABEL_FILL);
      });
      rowIndex++;
    }
    rowIndex++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${fileName}.xlsx`,
  );
}
