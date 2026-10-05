import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { CompanyInfo, getCompanyInfo, getLogoDataUri } from "@/lib/company";
import { downloadBlob } from "../types";
import {
  SectionExportDocument,
  chunkSectionFields,
  formatSectionValue,
  getExportDateLabel,
} from "../section-types";
import { PDF_FONT_FAMILY, registerPdfFont } from "./pdf-exporter";

const PRIMARY = "#1F4E79";
const PRIMARY_SOFT = "#EAF1F8";
const BORDER = "#D9DEE5";
const MUTED = "#6B7280";

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

  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: 700, color: PRIMARY },
  heading: { fontSize: 14, fontWeight: 700 },
  subheading: { fontSize: 9, color: MUTED, marginTop: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  tag: {
    fontSize: 7,
    color: PRIMARY,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginRight: 4,
  },

  summaryRow: { flexDirection: "row", marginTop: 10 },
  summaryBox: {
    flex: 1,
    padding: 8,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 6,
  },
  summaryLabel: { fontSize: 7, color: MUTED },
  summaryValue: { fontSize: 11, fontWeight: 700, marginTop: 3 },

  section: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: PRIMARY_SOFT,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionAccent: {
    width: 3,
    height: 10,
    backgroundColor: PRIMARY,
    marginRight: 6,
  },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: PRIMARY },
  fieldRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  fieldRowLast: { flexDirection: "row" },
  field: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  fieldDivider: { borderLeftWidth: 0.5, borderLeftColor: BORDER },
  fieldLabel: { color: MUTED, marginRight: 8 },
  fieldValue: { fontWeight: 700, textAlign: "right", flexShrink: 1 },

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

const initialsOf = (heading: string) =>
  heading
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");

function SectionPdfDocument({
  doc,
  company,
  logoDataUri,
  exportDate,
}: {
  doc: SectionExportDocument;
  company: CompanyInfo;
  logoDataUri?: string;
  exportDate: string;
}) {
  return (
    <Document title={`${doc.title} - ${doc.heading}`}>
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

        <View style={styles.profile} wrap={false}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(doc.heading) || "?"}</Text>
          </View>
          <View>
            <Text style={styles.heading}>{doc.heading}</Text>
            {doc.subheading ? (
              <Text style={styles.subheading}>{doc.subheading}</Text>
            ) : null}
            {doc.tags?.length ? (
              <View style={styles.tagRow}>
                {doc.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>
                    {tag}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {doc.summary?.length ? (
          <View style={styles.summaryRow} wrap={false}>
            {doc.summary.map((item, index) => (
              <View
                key={item.label}
                style={[styles.summaryBox, index > 0 ? { marginLeft: 6 } : {}]}
              >
                <Text style={styles.summaryLabel}>
                  {item.label.toLocaleUpperCase("tr-TR")}
                </Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {doc.sections.map((section) => {
          const rows = chunkSectionFields(section.fields);
          return (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader} wrap={false} minPresenceAhead={40}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {rows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  wrap={false}
                  style={
                    rowIndex === rows.length - 1 ? styles.fieldRowLast : styles.fieldRow
                  }
                >
                  {row.map((field, fieldIndex) => (
                    <View
                      key={field.label}
                      style={[styles.field, fieldIndex > 0 ? styles.fieldDivider : {}]}
                    >
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.fieldValue}>
                        {formatSectionValue(field.value)}
                      </Text>
                    </View>
                  ))}
                  {/* Tek alanlı (span olmayan) son satırda hizayı koru */}
                  {row.length === 1 && !row[0].span ? (
                    <View style={[styles.field, styles.fieldDivider]} />
                  ) : null}
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>
            {doc.title} · {doc.heading}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function exportSectionsToPdf(
  doc: SectionExportDocument,
  fileName: string,
) {
  registerPdfFont();

  const company = await getCompanyInfo();
  // Logo yüklenemezse export'u engelleme, logosuz devam et
  const logoDataUri = await getLogoDataUri(company.logoPath).catch(() => undefined);

  const blob = await pdf(
    <SectionPdfDocument
      doc={doc}
      company={company}
      logoDataUri={logoDataUri}
      exportDate={getExportDateLabel()}
    />,
  ).toBlob();

  downloadBlob(blob, `${fileName}.pdf`);
}
