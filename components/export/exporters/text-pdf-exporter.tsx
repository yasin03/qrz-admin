import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { CompanyInfo, getCompanyInfo, getLogoDataUri } from "@/lib/company";
import { downloadBlob } from "@/components/export/types";
import { getExportDateLabel } from "@/components/export/section-types";
import { PDF_FONT_FAMILY, registerPdfFont } from "./pdf-exporter";

// Log gibi satır satır düz metinlerin PDF'i. Başlık bloğu section-pdf-exporter ile aynı.

const PRIMARY = "#1F4E79";
const BORDER = "#D9DEE5";
const MUTED = "#6B7280";

export type TextExportDocument = {
  /** Belge başlığı, ör. "Bordro Log Kayıtları" */
  title: string;
  /** Başlık altı bilgi satırları, ör. "Personel: ...", "Dönem: ..." */
  subtitle?: string[];
  /** Boş string satırlar boşluk olarak korunur */
  lines: string[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: PDF_FONT_FAMILY,
    color: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  companyBlock: { maxWidth: "60%" },
  companyName: { fontSize: 12, fontWeight: 700, color: PRIMARY },
  companyLine: { fontSize: 8, color: MUTED, marginTop: 2 },
  logo: { width: 90, height: 42, objectFit: "contain" },
  docTitle: { fontSize: 10, fontWeight: 700, color: MUTED, textAlign: "right" },
  docDate: { fontSize: 7, color: MUTED, textAlign: "right", marginTop: 2 },

  subtitleBlock: { marginTop: 10, marginBottom: 6 },
  subtitle: { fontSize: 9, color: MUTED, marginTop: 2 },

  line: {
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  emptyLine: { height: 8 },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
  },
});

function TextPdfDocument({
  doc,
  company,
  logoDataUri,
  exportDate,
}: {
  doc: TextExportDocument;
  company: CompanyInfo;
  logoDataUri?: string;
  exportDate: string;
}) {
  return (
    <Document title={doc.title}>
      <Page size="A4" style={styles.page}>
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
          <View>
            {logoDataUri ? <Image src={logoDataUri} style={styles.logo} /> : null}
            <Text style={styles.docTitle}>{doc.title}</Text>
            <Text style={styles.docDate}>{exportDate}</Text>
          </View>
        </View>

        {doc.subtitle?.length ? (
          <View style={styles.subtitleBlock}>
            {doc.subtitle.map((line) => (
              <Text key={line} style={styles.subtitle}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {doc.lines.map((line, index) =>
          line ? (
            <Text key={index} style={styles.line} wrap={false}>
              {line}
            </Text>
          ) : (
            <View key={index} style={styles.emptyLine} />
          ),
        )}

        <View style={styles.footer} fixed>
          <Text>{doc.title}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function exportTextToPdf(doc: TextExportDocument, fileName: string) {
  registerPdfFont();

  const company = await getCompanyInfo();
  // Logo yüklenemezse export'u engelleme, logosuz devam et
  const logoDataUri = await getLogoDataUri(company.logoPath).catch(() => undefined);

  const blob = await pdf(
    <TextPdfDocument
      doc={doc}
      company={company}
      logoDataUri={logoDataUri}
      exportDate={getExportDateLabel()}
    />,
  ).toBlob();

  downloadBlob(blob, `${fileName}.pdf`);
}
