import { Document, Font, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import { CompanyInfo, getCompanyInfo, getLogoDataUri, getCompanyContactLine } from "@/lib/company";
import {
  ExportAlign,
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
import { getExportDateLabel } from "@/components/export/section-types";
import { BORDER, MUTED, PRIMARY, PRIMARY_SOFT, ROW_ALT, TEXT } from "./export-theme";

// react-pdf'in gömülü Helvetica fontu Türkçe karakterleri (Ş, ğ, ı, İ...) ve ₺
// simgesini içermiyor; bu yüzden public/fonts altındaki Roboto kaydediliyor.
export const PDF_FONT_FAMILY = "Roboto";
let isFontRegistered = false;

export function registerPdfFont() {
  if (isFontRegistered) return;
  const origin = window.location.origin;
  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: `${origin}/fonts/Roboto-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/Roboto-Bold.ttf`, fontWeight: 700 },
    ],
  });
  // Uzun kelimelerin tire ile bölünmesini engelle
  Font.registerHyphenationCallback((word) => [word]);
  isFontRegistered = true;
}

// Bölümlü PDF (bordro raporu) ile aynı görsel dil; tablo yoğun veri
// taşıdığı için yazılar daha küçük (7pt).
const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 28,
    fontSize: 7,
    fontFamily: PDF_FONT_FAMILY,
    color: TEXT,
    backgroundColor: "#FFFFFF",
  },
  // Tek satırlık başlık: solda rapor bilgileri, sağda şirket
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  reportBlock: {
    alignItems: "flex-start",
    flexShrink: 1,
    maxWidth: "50%",
    paddingRight: 16,
  },
  title: { fontSize: 15, fontWeight: 700 },
  docDate: { fontSize: 7, color: MUTED, marginTop: 2 },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },

  companyBlock: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    maxWidth: "50%",
  },
  companyText: { flexShrink: 1, alignItems: "flex-end" },
  companyName: { fontSize: 12, fontWeight: 700, color: PRIMARY },
  companyLine: { fontSize: 7.5, color: MUTED, marginTop: 2, textAlign: "right" },
  logo: { width: 64, height: 32, objectFit: "contain", marginLeft: 10 },
  tag: {
    fontSize: 7,
    color: PRIMARY,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginRight: 4,
    marginBottom: 2,
  },

  table: { width: "100%" },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: PRIMARY_SOFT,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
  },
  tableHeaderCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tableHeaderText: { fontSize: 7, fontWeight: 700, color: PRIMARY },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: ROW_ALT },
  tableCell: { paddingVertical: 3.5, paddingHorizontal: 4 },

  totalRow: {
    flexDirection: "row",
    backgroundColor: PRIMARY_SOFT,
    borderTopWidth: 1,
    borderTopColor: PRIMARY,
  },
  totalCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontWeight: 700,
    color: PRIMARY,
  },

  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    fontSize: 6.5,
    color: MUTED,
  },
});

// A4 (pt) eksi yatay sayfa boşlukları (2 × 28)
const CONTENT_WIDTH = { portrait: 595.28 - 56, landscape: 841.89 - 56 };
// Tablo yazı boyutu (pt) ve hücre yatay iç boşluğu (2 × 4)
const TABLE_FONT_SIZE = 7;
const CELL_PADDING_X = 8;

/**
 * minWidth: bölünemeyen en uzun kelime tek satıra sığsın (toplam sayfayı
 * aşarsa orantılı küçültülür). flexGrow: kalan genişlik içerik oranında.
 * Ölçüm kuralları: measureExportColumns.
 */
function getColumnLayout<T>(
  data: T[],
  columns: ExportColumn<T>[],
  orientation: "portrait" | "landscape",
) {
  const measured = measureExportColumns(data, columns).map((m) => ({
    minWidth: m.unbreakableEm * TABLE_FONT_SIZE + CELL_PADDING_X,
    weight: m.weight,
  }));

  const totalMin = measured.reduce((sum, m) => sum + m.minWidth, 0);
  const scale = Math.min(1, CONTENT_WIDTH[orientation] / totalMin);

  return measured.map((m) => ({
    flexGrow: m.weight,
    flexBasis: 0,
    minWidth: m.minWidth * scale,
  }));
}

/**
 * Metni kelime kelime ayrı Text olarak dizer; satır kaydırmayı flexWrap
 * yapar. Böylece kelimeler alt satıra hiçbir zaman harften bölünerek inmez
 * (tarayıcıda bazı kalın başlıklar "Personel G / rubu", "stihdam D / urumu"
 * gibi bir karakter kayık bölünüyor, ilk harf kayboluyordu).
 */
type PdfStyle = (typeof styles)[keyof typeof styles];

const JUSTIFY = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const;

function WordWrap({
  text,
  style,
  align = "left",
}: {
  text: string;
  style: PdfStyle;
  align?: ExportAlign;
}) {
  const words = text.split(/[ \t\r\n]+/).filter(Boolean);
  const gap = ((style as { fontSize?: number }).fontSize ?? 7) * 0.28;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: JUSTIFY[align],
      }}
    >
      {words.map((word, i) => (
        <Text
          key={i}
          style={[style, i < words.length - 1 ? { marginRight: gap } : {}]}
        >
          {word}
        </Text>
      ))}
    </View>
  );
}

function ExportPdfDocument<T>({
  data,
  columns,
  title,
  subtitle,
  company,
  logoDataUri,
  orientation,
  exportDate,
}: {
  data: T[];
  columns: ExportColumn<T>[];
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  logoDataUri?: string;
  orientation: "portrait" | "landscape";
  exportDate: string;
}) {
  const totals = getExportTotals(data, columns);
  const layout = getColumnLayout(data, columns, orientation);
  const tags = [
    ...(subtitle ? subtitle.split(" · ").filter(Boolean) : []),
    getRecordCountLabel(data.length),
  ];

  const cellStyle = (index: number) => ({
    ...layout[index],
    textAlign: getExportAlign(columns[index]),
  });

  return (
    <Document title={title}>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.reportBlock}>
            <WordWrap text={title} style={styles.title} />
            <Text style={styles.docDate}>{exportDate}</Text>
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <Text key={tag} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.companyBlock}>
            <View style={styles.companyText}>
              {company.name ? (
                <WordWrap text={company.name} style={styles.companyName} align="right" />
              ) : null}
              {company.address ? (
                <Text style={styles.companyLine}>{company.address}</Text>
              ) : null}
              {getCompanyContactLine(company) ? (
                <Text style={styles.companyLine}>{getCompanyContactLine(company)}</Text>
              ) : null}
            </View>
            {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            {columns.map((col, i) => (
              <View
                key={col.header}
                style={[
                  styles.tableHeaderCell,
                  layout[i],
                  { justifyContent: JUSTIFY[getExportAlign(col)] },
                ]}
              >
                <WordWrap
                  text={col.header}
                  style={styles.tableHeaderText}
                  align={getExportAlign(col)}
                />
              </View>
            ))}
          </View>
          {data.map((row, rowIndex) => (
            <View
              key={rowIndex}
              wrap={false}
              style={
                rowIndex % 2 === 1
                  ? [styles.tableRow, styles.tableRowAlt]
                  : styles.tableRow
              }
            >
              {columns.map((col, i) => (
                <Text key={col.header} style={[styles.tableCell, cellStyle(i)]}>
                  {getExportValue(row, col)}
                </Text>
              ))}
            </View>
          ))}
          {totals ? (
            <View style={styles.totalRow} wrap={false}>
              {getExportTotalLabels(totals, columns).map((label, i) => (
                <Text key={columns[i].header} style={[styles.totalCell, cellStyle(i)]}>
                  {label}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.footer} fixed>
          <Text>{[title, company.name].filter(Boolean).join(" · ")}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function exportToPdf<T>(
  data: T[],
  columns: ExportColumn<T>[],
  meta: ExportMeta
) {
  registerPdfFont();

  const company = await getCompanyInfo();
  // Logo yüklenemezse export'u engelleme, logosuz devam et
  const logoDataUri = await getLogoDataUri(company.logoPath).catch(() => undefined);
  const orientation = meta.orientation ?? (columns.length > 6 ? "landscape" : "portrait");

  const blob = await pdf(
    <ExportPdfDocument
      data={data}
      columns={columns}
      title={meta.title ?? "Rapor"}
      subtitle={meta.subtitle}
      company={company}
      logoDataUri={logoDataUri}
      orientation={orientation}
      exportDate={getExportDateLabel()}
    />
  ).toBlob();

  downloadBlob(blob, `${meta.fileName ?? "rapor"}.pdf`);
}
