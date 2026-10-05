import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { getCompanyInfo, getLogoArrayBuffer } from "@/lib/company";
import { downloadBlob } from "../types";
import {
  SectionExportDocument,
  SectionExportField,
  chunkSectionFields,
  formatSectionValue,
  getExportDateLabel,
} from "../section-types";

const PRIMARY = "1F4E79";
const PRIMARY_SOFT = "EAF1F8";
const LABEL_FILL = "F7F9FB";
const BORDER = "D9DEE5";
const MUTED = "6B7280";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};
const THIN = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const THIN_BORDERS = {
  top: THIN,
  bottom: THIN,
  left: THIN,
  right: THIN,
  insideHorizontal: THIN,
  insideVertical: THIN,
};

// Genişlikler twip (DXA) olarak veriliyor: yüzde genişlikleri Word dışındaki
// görüntüleyiciler (LibreOffice, Quick Look) yok sayıp tabloyu daraltıyor.
// A4 genişliği 11906, sol/sağ kenar boşluğu 720'şer.
const PAGE_MARGIN = 720;
const CONTENT_WIDTH = 11906 - PAGE_MARGIN * 2;
const pct = (percent: number) => Math.round((CONTENT_WIDTH * percent) / 100);
const dxa = (size: number) => ({ size, type: WidthType.DXA });

// Bölüm tablosu: Etiket | Değer | Etiket | Değer
const COL_WIDTHS = [pct(22), pct(28), pct(22), pct(28)];
const SPAN_VALUE_WIDTH = COL_WIDTHS[1] + COL_WIDTHS[2] + COL_WIDTHS[3];

const shade = (fill: string) => ({
  type: ShadingType.CLEAR,
  color: "auto",
  fill,
});

function labelCell(field: SectionExportField) {
  return new TableCell({
    width: dxa(COL_WIDTHS[0]),
    shading: shade(LABEL_FILL),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: field.label, size: 17, color: MUTED })],
      }),
    ],
  });
}

function valueCell(field: SectionExportField | null, columnSpan = 1) {
  const width = columnSpan === 3 ? SPAN_VALUE_WIDTH : COL_WIDTHS[1];
  return new TableCell({
    width: dxa(width),
    columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: field
          ? [
              new TextRun({
                text: formatSectionValue(field.value),
                size: 18,
                bold: true,
              }),
            ]
          : [],
      }),
    ],
  });
}

function emptyCell() {
  return new TableCell({
    width: dxa(COL_WIDTHS[2]),
    shading: shade(LABEL_FILL),
    children: [new Paragraph("")],
  });
}

function sectionBlock(title: string, fields: SectionExportField[]) {
  const heading = new Paragraph({
    keepNext: true,
    spacing: { before: 280, after: 80 },
    shading: shade(PRIMARY_SOFT),
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color: PRIMARY, space: 6 },
    },
    children: [
      new TextRun({ text: title, bold: true, size: 21, color: PRIMARY }),
    ],
  });

  const rows = chunkSectionFields(fields).map((row) => {
    const [first, second] = row;
    const cells = first.span
      ? [labelCell(first), valueCell(first, 3)]
      : [
          labelCell(first),
          valueCell(first),
          second ? labelCell(second) : emptyCell(),
          valueCell(second ?? null),
        ];
    return new TableRow({ cantSplit: true, children: cells });
  });

  const table = new Table({
    width: dxa(CONTENT_WIDTH),
    layout: TableLayoutType.FIXED,
    columnWidths: COL_WIDTHS,
    borders: THIN_BORDERS,
    rows,
  });

  return [heading, table];
}

export async function exportSectionsToDocx(
  doc: SectionExportDocument,
  fileName: string,
) {
  const company = await getCompanyInfo();
  const logoBuffer = await getLogoArrayBuffer(company.logoPath).catch(
    () => undefined,
  );
  const exportDate = getExportDateLabel();

  const headerTable = new Table({
    width: dxa(CONTENT_WIDTH),
    layout: TableLayoutType.FIXED,
    columnWidths: [pct(60), pct(40)],
    borders: {
      ...NO_BORDERS,
      bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: dxa(pct(60)),
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: company.name,
                    bold: true,
                    size: 24,
                    color: PRIMARY,
                  }),
                ],
              }),
              ...[company.address, company.phone].filter(Boolean).map(
                (line) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: line, size: 16, color: MUTED }),
                    ],
                  }),
              ),
            ],
          }),
          new TableCell({
            width: dxa(pct(40)),
            borders: NO_BORDERS,
            children: [
              ...(logoBuffer
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new ImageRun({
                          type: "png",
                          data: logoBuffer,
                          transformation: { width: 110, height: 52 },
                        }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: doc.title,
                    bold: true,
                    size: 20,
                    color: MUTED,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: exportDate, size: 15, color: MUTED }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const profile = [
    new Paragraph({
      spacing: { before: 280 },
      children: [new TextRun({ text: doc.heading, bold: true, size: 30 })],
    }),
    ...(doc.subheading
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: doc.subheading, size: 19, color: MUTED }),
            ],
          }),
        ]
      : []),
    ...(doc.tags?.length
      ? [
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new TextRun({
                text: doc.tags.join("  ·  "),
                size: 16,
                color: PRIMARY,
              }),
            ],
          }),
        ]
      : []),
  ];

  const summary = doc.summary?.length
    ? [
        new Paragraph({ spacing: { before: 160 }, children: [] }),
        new Table({
          width: dxa(CONTENT_WIDTH),
          layout: TableLayoutType.FIXED,
          columnWidths: doc.summary.map(() =>
            Math.floor(CONTENT_WIDTH / doc.summary!.length),
          ),
          borders: {
            ...NO_BORDERS,
            insideVertical: {
              style: BorderStyle.SINGLE,
              size: 24,
              color: "FFFFFF",
            },
          },
          rows: [
            new TableRow({
              children: doc.summary.map(
                (item) =>
                  new TableCell({
                    width: dxa(Math.floor(CONTENT_WIDTH / doc.summary!.length)),
                    shading: shade(PRIMARY_SOFT),
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.label.toLocaleUpperCase("tr-TR"),
                            size: 14,
                            color: MUTED,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.value,
                            bold: true,
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        }),
      ]
    : [];

  const document = new Document({
    title: `${doc.title} - ${doc.heading}`,
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
              right: PAGE_MARGIN,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    size: 14,
                    color: MUTED,
                    children: [
                      `${doc.title} · ${doc.heading}    Sayfa `,
                      PageNumber.CURRENT,
                      " / ",
                      PageNumber.TOTAL_PAGES,
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          headerTable,
          ...profile,
          ...summary,
          ...doc.sections.flatMap((section) =>
            sectionBlock(section.title, section.fields),
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${fileName}.docx`);
}
