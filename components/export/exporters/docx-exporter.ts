import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { COMPANY_INFO, getLogoArrayBuffer } from "@/lib/company";
import { ExportColumn, ExportMeta, downloadBlob, getExportValue } from "../types";

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
  const logoBuffer = await getLogoArrayBuffer().catch(() => undefined);

  // Sol: şirket bilgisi, sağ: logo — tek satırlık, çerçevesiz bir tablo ile hizalanıyor
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [new TextRun({ text: COMPANY_INFO.name, bold: true, size: 24 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: COMPANY_INFO.address, size: 16, color: "555555" }),
                ],
              }),
              ...(COMPANY_INFO.phone
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: COMPANY_INFO.phone, size: 16, color: "555555" }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
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

  const dataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: columns.map(
          (col) =>
            new TableCell({
              shading: { fill: "F0F0F0" },
              children: [
                new Paragraph({ children: [new TextRun({ text: col.header, bold: true })] }),
              ],
            })
        ),
      }),
      ...data.map(
        (row) =>
          new TableRow({
            children: columns.map(
              (col) =>
                new TableCell({
                  children: [new Paragraph(getExportValue(row, col))],
                })
            ),
          })
      ),
    ],
  });

  const isLandscape = meta.orientation === "landscape";

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: convertMillimetersToTwip(isLandscape ? 297 : 210),
              height: convertMillimetersToTwip(isLandscape ? 210 : 297),
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 300 },
            children: [new TextRun({ text: meta.title ?? "Rapor", bold: true })],
          }),
          dataTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${meta.fileName ?? "rapor"}.docx`);
}