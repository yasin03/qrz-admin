import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { getCompanyInfo, getLogoArrayBuffer, getCompanyContactLine } from "@/lib/company";
import {
  ExportColumn,
  ExportMeta,
  downloadBlob,
  getExportTotalLabels,
  getExportTotals,
  getExportValue,
  getRecordCountLabel,
  getExportAlign,
  measureExportColumns,
} from "@/components/export/types";
import { BORDER, MUTED, PRIMARY, PRIMARY_SOFT, ROW_ALT, TEXT, hex } from "./export-theme";

// Tablo yazı boyutu (half-point): 15 = 7,5pt — yoğun veride sığsın
const TABLE_FONT_SIZE = 15;
const THIN = (color: string) => ({ style: BorderStyle.SINGLE, size: 4, color: hex(color) });
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const CELL_MARGINS = { top: 40, bottom: 40, left: 60, right: 60 };
// Yoğun tablolar için dar kenar boşluğu: 720 twip = 1,27 cm
const PAGE_MARGIN = 720;
const FONT = "Calibri";
// 1 em'in twip karşılığı (yazı boyutu pt × 20) — bölünemeyen kelimelerin
// (TC, tarih, tutar) tek satıra sığması için
const EM_TWIPS = (TABLE_FONT_SIZE / 2) * 20;

/**
 * Önce her kolona bölünemeyen en uzun kelimesi kadar yer (+ hücre boşluğu),
 * kalan genişlik içerik oranında paylaştırılır. Minimumlar sayfayı aşarsa
 * orantılı küçültülür. (PDF'teki minWidth + flexGrow ile aynı mantık.)
 */
function getColumnWidths<T>(data: T[], columns: ExportColumn<T>[], contentWidth: number) {
  const measured = measureExportColumns(data, columns);
  const mins = measured.map(
    (m) => m.unbreakableEm * EM_TWIPS + CELL_MARGINS.left + CELL_MARGINS.right,
  );
  const totalMin = mins.reduce((sum, w) => sum + w, 0);

  if (totalMin >= contentWidth) {
    return mins.map((w) => Math.floor((w * contentWidth) / totalMin));
  }

  const extra = contentWidth - totalMin;
  const totalWeight = measured.reduce((sum, m) => sum + m.weight, 0);
  return mins.map((w, i) => Math.floor(w + (extra * measured[i].weight) / totalWeight));
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

export async function exportToDocx<T>(
  data: T[],
  columns: ExportColumn<T>[],
  meta: ExportMeta
) {
  const isLandscape = meta.orientation === "landscape";
  // Sayfa genişliği eksi kenar boşlukları. Tablolara twip cinsinden sabit
  // genişlik veriliyor: yalnızca yüzde verilince bazı okuyucular (Google
  // Docs, LibreOffice, Quick Look) kolonları daraltıp metni harf harf alt
  // alta diziyordu.
  const contentWidth =
    convertMillimetersToTwip(isLandscape ? 297 : 210) - 2 * PAGE_MARGIN;

  const company = await getCompanyInfo();
  const logoBuffer = await getLogoArrayBuffer(company.logoPath).catch(() => undefined);

  // Sol: şirket bilgisi, sağ: logo — tek satırlık, çerçevesiz bir tablo ile hizalanıyor
  const headerColumnWidths = [
    Math.round(contentWidth * 0.65),
    Math.round(contentWidth * 0.35),
  ];
  const headerTable = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: headerColumnWidths,
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: headerColumnWidths[0], type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: company.name, bold: true, size: 24, color: hex(PRIMARY) }),
                ],
              }),
              ...(company.address
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: company.address, size: 16, color: hex(MUTED) }),
                      ],
                    }),
                  ]
                : []),
              ...(getCompanyContactLine(company)
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: getCompanyContactLine(company), size: 16, color: hex(MUTED) }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          new TableCell({
            width: { size: headerColumnWidths[1], type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: logoBuffer
                  ? [
                      new ImageRun({
                        type: "png",
                        data: logoBuffer,
                        transformation: { width: 110, height: 52 },
                      }),
                    ]
                  : [],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const totals = getExportTotals(data, columns);
  const cellAlignment = (col: ExportColumn<T>) =>
    ({ left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT })[
      getExportAlign(col)
    ];

  const columnWidths = getColumnWidths(data, columns, contentWidth);

  const cell = (
    text: string,
    col: ExportColumn<T>,
    options: { fill?: string; bold?: boolean; color?: string } = {},
  ) =>
    new TableCell({
      width: { size: columnWidths[columns.indexOf(col)], type: WidthType.DXA },
      margins: CELL_MARGINS,
      shading: options.fill ? { fill: hex(options.fill) } : undefined,
      children: [
        new Paragraph({
          alignment: cellAlignment(col),
          children: [
            new TextRun({
              text,
              bold: options.bold,
              size: TABLE_FONT_SIZE,
              color: hex(options.color ?? TEXT),
            }),
          ],
        }),
      ],
    });

  // PDF ile aynı görünüm: renkli başlık satırı, zebra satırlar, renkli toplam
  const dataTable = new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders: {
      top: NONE,
      left: NONE,
      right: NONE,
      insideVertical: NONE,
      bottom: THIN(BORDER),
      insideHorizontal: THIN(BORDER),
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: columns.map((col) =>
          cell(col.header, col, { fill: PRIMARY_SOFT, bold: true, color: PRIMARY }),
        ),
      }),
      ...data.map(
        (row, rowIndex) =>
          new TableRow({
            children: columns.map((col) =>
              cell(getExportValue(row, col), col, {
                fill: rowIndex % 2 === 1 ? ROW_ALT : undefined,
              }),
            ),
          })
      ),
      ...(totals
        ? [
            new TableRow({
              children: getExportTotalLabels(totals, columns).map((label, i) =>
                cell(label, columns[i], { fill: PRIMARY_SOFT, bold: true, color: PRIMARY }),
              ),
            }),
          ]
        : []),
    ],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [
      {
        properties: {
          page: {
            // docx, LANDSCAPE'te genişlik/yüksekliği kendisi yer değiştiriyor;
            // bu yüzden her zaman dikey A4 ölçüsü verilir. (Önceden yatay
            // ölçü verildiği için iki kez dönüp dikey sayfa çıkıyordu.)
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: PAGE_MARGIN,
              right: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
            },
          },
        },
        children: [
          headerTable,
          // Şirket bilgisinin altındaki lacivert çizgi (PDF ile aynı)
          new Paragraph({
            spacing: { after: 240 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: hex(PRIMARY) } },
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: meta.title ?? "Rapor",
                bold: true,
                size: 28,
                color: hex(TEXT),
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: [meta.subtitle, getRecordCountLabel(data.length)]
                  .filter(Boolean)
                  .join(" · "),
                size: 16,
                color: hex(PRIMARY),
              }),
            ],
          }),
          dataTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${meta.fileName ?? "rapor"}.docx`);
}