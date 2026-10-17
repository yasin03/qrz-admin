import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import {
  PDF_FONT_FAMILY,
  registerPdfFont,
} from "@/components/export/exporters/pdf-exporter";
import { downloadBlob } from "@/components/export/types";
import { getLogoDataUri } from "@/lib/company";
import {
  QR_BRAND_CYAN,
  QR_BRAND_NAVY,
  blobToDataUri,
  getStyledQrPngBlob,
} from "@/lib/qr-utils";

import {
  QR_A4_LOGO_PATH,
  QR_A4_SLOGAN,
  QR_A4_TALIMAT,
  type QrA4Content,
} from "./qr-a4-content";

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 56,
    alignItems: "center",
    color: QR_BRAND_NAVY,
  },
  logo: { width: 170, height: 52, objectFit: "contain" },
  companyName: { marginTop: 18, fontSize: 18, fontWeight: 700, textAlign: "center" },
  subeName: { marginTop: 4, fontSize: 12, color: "#475569", textAlign: "center" },
  qrCard: {
    marginTop: 28,
    padding: 18,
    borderWidth: 2,
    borderColor: QR_BRAND_CYAN,
    borderRadius: 24,
  },
  // ~12,7 cm — A4'te uzaktan da rahat okunur
  qr: { width: 360, height: 360 },
  lokasyonName: {
    marginTop: 26,
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
  },
  bolumName: { marginTop: 6, fontSize: 14, color: "#475569", textAlign: "center" },
  talimat: {
    marginTop: 26,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#E6F8FD",
    fontSize: 12,
    textAlign: "center",
  },
  footerBand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
    backgroundColor: QR_BRAND_NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: { fontSize: 9, color: "#FFFFFF", letterSpacing: 1 },
});

function QrA4Document({
  content,
  qrDataUri,
  logoDataUri,
}: {
  content: QrA4Content;
  qrDataUri: string;
  logoDataUri: string | null;
}) {
  return (
    <Document title={content.lokasyonAdi}>
      <Page size="A4" style={styles.page}>
        {logoDataUri && <Image src={logoDataUri} style={styles.logo} />}

        {content.sirketAdi ? (
          <Text style={styles.companyName}>{content.sirketAdi}</Text>
        ) : null}
        {content.subeAdi ? (
          <Text style={styles.subeName}>{content.subeAdi}</Text>
        ) : null}

        <View style={styles.qrCard}>
          <Image src={qrDataUri} style={styles.qr} />
        </View>

        <Text style={styles.lokasyonName}>{content.lokasyonAdi}</Text>
        {content.bolumAdi ? (
          <Text style={styles.bolumName}>{content.bolumAdi}</Text>
        ) : null}

        <Text style={styles.talimat}>{QR_A4_TALIMAT}</Text>

        <View style={styles.footerBand} fixed>
          <Text style={styles.footerText}>{QR_A4_SLOGAN}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadQrA4Pdf(
  content: QrA4Content,
  qrValue: string,
  fileName: string,
) {
  registerPdfFont();

  const [qrDataUri, logoDataUri] = await Promise.all([
    getStyledQrPngBlob(qrValue, 1200).then(blobToDataUri),
    getLogoDataUri(QR_A4_LOGO_PATH).catch(() => null),
  ]);

  const blob = await pdf(
    <QrA4Document
      content={content}
      qrDataUri={qrDataUri}
      logoDataUri={logoDataUri}
    />,
  ).toBlob();

  downloadBlob(blob, `${fileName}.pdf`);
}
