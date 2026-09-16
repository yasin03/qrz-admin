import { Document, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import { COMPANY_INFO, getLogoDataUri } from "@/lib/company";
import { ExportColumn, ExportMeta, downloadBlob, getExportValue } from "../types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
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
  logoDataUri,
  orientation,
}: {
  data: T[];
  columns: ExportColumn<T>[];
  title: string;
  logoDataUri?: string;
  orientation: "portrait" | "landscape";
}) {
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyLine}>{COMPANY_INFO.address}</Text>
            {COMPANY_INFO.phone ? (
              <Text style={styles.companyLine}>{COMPANY_INFO.phone}</Text>
            ) : null}
          </View>
          {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            {columns.map((col) => (
              <Text key={col.header} style={styles.tableHeaderCell}>
                {col.header}
              </Text>
            ))}
          </View>
          {data.map((row, index) => (
            <View style={styles.tableRow} key={index} wrap={false}>
              {columns.map((col) => (
                <Text key={col.header} style={styles.tableCell}>
                  {getExportValue(row, col)}
                </Text>
              ))}
            </View>
          ))}
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
  // Logo yüklenemezse export'u engelleme, logosuz devam et
  const logoDataUri = await getLogoDataUri().catch(() => undefined);
  const orientation = meta.orientation ?? (columns.length > 6 ? "landscape" : "portrait");

  const blob = await pdf(
    <ExportPdfDocument
      data={data}
      columns={columns}
      title={meta.title ?? "Rapor"}
      logoDataUri={logoDataUri}
      orientation={orientation}
    />
  ).toBlob();

  downloadBlob(blob, `${meta.fileName ?? "rapor"}.pdf`);
}