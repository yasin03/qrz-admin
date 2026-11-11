import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  Footer,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

import { downloadBlob } from "@/components/export/types";
import { getLogoArrayBuffer } from "@/lib/company";
import { QR_BRAND_CYAN, QR_BRAND_NAVY, getStyledQrPngBlob } from "@/lib/qr-utils";

import {
  QR_A4_LOGO_PATH,
  QR_A4_SLOGAN,
  QR_A4_TALIMAT,
  type QrA4Content,
} from "./qr-a4-content";

// A4 QR sayfasının Word versiyonu — qr-a4-pdf.tsx ile aynı tasarım:
// logo, şirket/şube, turkuaz çerçeveli kart içinde büyük QR, lokasyon/bölüm,
// açık turkuaz talimat kutusu, en altta lacivert bant içinde slogan.
// Word'de yuvarlak köşe olmadığı için kartlar düz köşeli tablo hücresi.

// docx renkleri "#" olmadan bekliyor
const NAVY = QR_BRAND_NAVY.slice(1);
const CYAN = QR_BRAND_CYAN.slice(1);
const GRAY = "475569";
const TALIMAT_BG = "E6F8FD";

// Times New Roman yerine her sistemde bulunan sans-serif font (PDF'teki
// Roboto'ya en yakın görünüm). Roboto gömülmüyor: docx'in font gömmesi Node
// Buffer istiyor ve LibreOffice gömülü fontları çoğu zaman yok sayıyor.
const FONT = "Arial";

// Yazı boyutları docx'te yarım punto: PDF'teki pt değerinin 2 katı.
const pt = (value: number) => value * 2;

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

function centered(
  children: (TextRun | ImageRun)[],
  spacing?: { before?: number; after?: number },
) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing, children });
}

/** Sayfada ortalanmış, tek hücreli "kart" (PDF'teki View kutularının karşılığı). */
function card({
  widthMm,
  children,
  borderColor,
  fill,
  paddingMm,
}: {
  widthMm: number;
  children: Paragraph[];
  borderColor?: string;
  fill?: string;
  paddingMm: number;
}) {
  const border = borderColor
    ? { style: BorderStyle.SINGLE, size: 16, color: borderColor }
    : NO_BORDER;
  const padding = convertMillimetersToTwip(paddingMm);

  return new Table({
    alignment: AlignmentType.CENTER,
    width: { size: convertMillimetersToTwip(widthMm), type: WidthType.DXA },
    borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: convertMillimetersToTwip(widthMm), type: WidthType.DXA },
            borders: { top: border, bottom: border, left: border, right: border },
            shading: fill
              ? { type: ShadingType.CLEAR, color: "auto", fill }
              : undefined,
            margins: { top: padding, bottom: padding, left: padding, right: padding },
            verticalAlign: VerticalAlign.CENTER,
            children,
          }),
        ],
      }),
    ],
  });
}

export async function downloadQrA4Docx(
  content: QrA4Content,
  qrValue: string,
  fileName: string,
) {
  const [qrBuffer, logoBuffer] = await Promise.all([
    getStyledQrPngBlob(qrValue, 1200).then((blob) => blob.arrayBuffer()),
    getLogoArrayBuffer(QR_A4_LOGO_PATH).catch(() => null),
  ]);

  const children: (Paragraph | Table)[] = [];

  if (logoBuffer) {
    children.push(
      centered([
        new ImageRun({
          type: "png",
          data: logoBuffer,
          // logo-pri.png oranı ~3.6:1
          transformation: { width: 190, height: 53 },
        }),
      ]),
    );
  }

  if (content.sirketAdi) {
    children.push(
      centered(
        [new TextRun({ text: content.sirketAdi, bold: true, size: pt(18), color: NAVY })],
        { before: 280 },
      ),
    );
  }
  if (content.subeAdi) {
    children.push(
      centered([new TextRun({ text: content.subeAdi, size: pt(12), color: GRAY })], {
        before: 60,
      }),
    );
  }

  // QR kartı (turkuaz çerçeve)
  children.push(centered([], { before: 360 }));
  children.push(
    card({
      widthMm: 140,
      borderColor: CYAN,
      paddingMm: 6,
      children: [
        centered([
          new ImageRun({
            type: "png",
            data: qrBuffer,
            // ~12,7 cm — PDF'teki boyut
            transformation: { width: 480, height: 480 },
          }),
        ]),
      ],
    }),
  );

  children.push(
    centered(
      [new TextRun({ text: content.lokasyonAdi, bold: true, size: pt(28), color: NAVY })],
      { before: 400 },
    ),
  );
  if (content.bolumAdi) {
    children.push(
      centered([new TextRun({ text: content.bolumAdi, size: pt(14), color: GRAY })], {
        before: 80,
      }),
    );
  }

  // Talimat kutusu (açık turkuaz zemin)
  children.push(centered([], { before: 360 }));
  children.push(
    card({
      widthMm: 140,
      fill: TALIMAT_BG,
      paddingMm: 3,
      children: [
        centered([new TextRun({ text: QR_A4_TALIMAT, size: pt(12), color: NAVY })]),
      ],
    }),
  );

  // En altta lacivert bant içinde slogan (PDF'teki footerBand)
  const footer = new Footer({
    children: [
      card({
        widthMm: 210,
        fill: NAVY,
        paddingMm: 3,
        children: [
          centered([
            new TextRun({
              text: QR_A4_SLOGAN,
              size: pt(9),
              color: "FFFFFF",
              characterSpacing: 20,
            }),
          ]),
        ],
      }),
    ],
  });

  const doc = new Document({
    // Tüm belgenin varsayılan fontu (Word'ün varsayılanı Times New Roman olmasın)
    styles: {
      default: {
        document: { run: { font: FONT, color: NAVY } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(17),
              bottom: convertMillimetersToTwip(14),
              // Yan boşluk yok: footer'daki lacivert bant (210 mm) sayfayı
              // kenardan kenara kaplasın. İçerik zaten ortalı ve kartların
              // genişliği sabit olduğu için kenarlara yapışmıyor.
              left: 0,
              right: 0,
              footer: 0,
            },
          },
        },
        footers: { default: footer },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileName}.docx`);
}
