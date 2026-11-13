import { Document, Font, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import { CompanyInfo, getCompanyInfo, getLogoDataUri } from "@/lib/company";
import {
  ExportColumn,
  ExportMeta,
  downloadBlob,
  getExportTotalLabels,
  getExportTotals,
  getExportValue,
  getRecordCountLabel,
  isNumericExportColumn,
} from "@/components/export/types";

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

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: PDF_FONT_FAMILY },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  companyBlock: { maxWidth: "60%" },
  companyName: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  companyLine: { fontSize: 8, color: "#555555" },
  logo: { width: 90, height: 42, objectFit: "contain" },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginVertical: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  subtitle: { fontSize: 9, color: "#555555", textAlign: "center", marginTop: -6, marginBottom: 10 },
  recordCount: { fontSize: 8, color: "#555555", marginBottom: 6 },
  table: { width: "100%" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CCCCCC",
  },
  tableHeaderCell: { flex: 1, padding: 4, fontSize: 8, fontWeight: 700 },
  tableCell: { flex: 1, padding: 4, fontSize: 8 },
  tableCellRight: { textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  totalCell: { flex: 1, padding: 4, fontSize: 8, fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#888888",
    textAlign: "center",
  },
});

function ExportPdfDocument<T>({
  data,
  columns,
  title,
  subtitle,
  company,
  logoDataUri,
  orientation,
}: {
  data: T[];
  columns: ExportColumn<T>[];
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  logoDataUri?: string;
  orientation: "portrait" | "landscape";
}) {
  const totals = getExportTotals(data, columns);
  const cellStyle = (col: ExportColumn<T>) =>
    isNumericExportColumn(col)
      ? [styles.tableCell, styles.tableCellRight]
      : styles.tableCell;

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {company.name ? (
              <Text style={styles.companyName}>{company.name}</Text>
            ) : null}
            {company.address ? (
              <Text style={styles.companyLine}>{company.address}</Text>
            ) : null}
            {company.phone ? (
              <Text style={styles.companyLine}>{company.phone}</Text>
            ) : null}
          </View>
          {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.recordCount}>{getRecordCountLabel(data.length)}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            {columns.map((col) => (
              <Text
                key={col.header}
                style={
                  isNumericExportColumn(col)
                    ? [styles.tableHeaderCell, styles.tableCellRight]
                    : styles.tableHeaderCell
                }
              >
                {col.header}
              </Text>
            ))}
          </View>
          {data.map((row, index) => (
            <View style={styles.tableRow} key={index} wrap={false}>
              {columns.map((col) => (
                <Text key={col.header} style={cellStyle(col)}>
                  {getExportValue(row, col)}
                </Text>
              ))}
            </View>
          ))}
          {totals ? (
            <View style={styles.totalRow} wrap={false}>
              {getExportTotalLabels(totals, columns).map((label, i) => (
                <Text
                  key={columns[i].header}
                  style={
                    isNumericExportColumn(columns[i])
                      ? [styles.totalCell, styles.tableCellRight]
                      : styles.totalCell
                  }
                >
                  {label}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`}
          fixed
        />
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
    />
  ).toBlob();

  downloadBlob(blob, `${meta.fileName ?? "rapor"}.pdf`);
}