// Teklif PDF belgesi (@react-pdf/renderer). Liste export'larıyla aynı tema,
// font ve şirket başlığı kullanılır. Bu modül ağır olduğu için ekranlarda
// dinamik import edilir (bkz. components/teklifler/TeklifPdfOnizleme.tsx).
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { registerPdfFont, PDF_FONT_FAMILY } from "@/components/export/exporters/pdf-exporter";
import { BORDER, MUTED, PRIMARY, PRIMARY_SOFT, ROW_ALT, TEXT } from "@/components/export/exporters/export-theme";
import { getCompanyContactLine, getCompanyInfo, getLogoDataUri, type CompanyInfo } from "@/lib/company";
import { gunFormat, kalemIskontoMetni, kdvDagilimiHesapla, paraFormat } from "@/modules/crm/lib/teklif";
import type { TeklifPdfVeri } from "@/modules/crm/types/teklif";

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 9,
    fontFamily: PDF_FONT_FAMILY,
    color: TEXT,
    backgroundColor: "#FFFFFF",
  },

  // Başlık: solda şirket, sağda TEKLİF bilgileri
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  company: { flexDirection: "row", alignItems: "center", maxWidth: "58%" },
  logo: { width: 72, height: 36, objectFit: "contain", marginRight: 10 },
  companyName: { fontSize: 12, fontWeight: 700, color: PRIMARY },
  companyLine: { fontSize: 8, color: MUTED, marginTop: 2 },
  docBlock: { alignItems: "flex-end", maxWidth: "40%" },
  docTitle: { fontSize: 20, fontWeight: 700, color: PRIMARY, letterSpacing: 1 },
  docMeta: { flexDirection: "row", marginTop: 3 },
  docMetaLabel: { color: MUTED, width: 62, textAlign: "right", marginRight: 6 },
  docMetaValue: { fontWeight: 700, textAlign: "right" },
  taslak: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 7.5,
    fontWeight: 700,
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    borderRadius: 3,
  },

  // Alıcı + konu
  infoRow: { flexDirection: "row", marginBottom: 14 },
  infoBox: {
    flex: 1,
    padding: 9,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 4,
  },
  infoLabel: { fontSize: 7.5, color: MUTED, marginBottom: 3, textTransform: "uppercase" },
  infoName: { fontSize: 11, fontWeight: 700 },
  infoLine: { marginTop: 2 },

  paragraph: { marginBottom: 12, lineHeight: 1.4 },
  sectionTitle: { fontSize: 9.5, fontWeight: 700, color: PRIMARY, marginBottom: 4 },

  // Kalem tablosu
  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 3, marginBottom: 12 },
  thead: { flexDirection: "row", backgroundColor: PRIMARY },
  th: { paddingVertical: 5, paddingHorizontal: 5, color: "#FFFFFF", fontWeight: 700, fontSize: 8 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { paddingVertical: 5, paddingHorizontal: 5 },
  detay: { fontSize: 7.5, color: MUTED, marginTop: 1.5 },

  // Toplamlar
  totals: { alignSelf: "flex-end", width: "46%", marginBottom: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  totalLabel: { color: MUTED },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  grandText: { color: "#FFFFFF", fontWeight: 700, fontSize: 10.5 },
  tlLine: { fontSize: 7.5, color: MUTED, textAlign: "right", marginTop: 3 },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 5,
  },
});

// Kolon genişlikleri (toplam 100%)
const K = {
  no: "5%",
  kalem: "37%",
  miktar: "12%",
  fiyat: "15%",
  isk: "8%",
  kdv: "7%",
  toplam: "16%",
} as const;

const miktar = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
const oran = (n: number) => `%${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;

function TeklifPdfDocument({
  v,
  company,
  logo,
}: {
  v: TeklifPdfVeri;
  company: CompanyInfo;
  logo?: string;
}) {
  const para = (n: number) => paraFormat(n, v.ParaBirimi);
  const t = v.Toplamlar;
  const satirIskonto = Math.max(t.IskontoToplam - t.GenelIskontoTutari, 0);
  const kdvDagilimi = kdvDagilimiHesapla(v.Kalemler, {
    GenelIskontoOrani: v.GenelIskontoOrani,
    GenelIskontoTutari: t.GenelIskontoTutari,
  });
  const iletisim = getCompanyContactLine(company);
  const taslak = v.TeklifNoTam === "Taslak";

  return (
    <Document title={`Teklif ${v.TeklifNoTam}`} author={company.name} subject={v.Konu}>
      <Page size="A4" style={s.page}>
        {/* Başlık */}
        <View style={s.header} fixed>
          <View style={s.company}>
            {/* react-pdf Image'ı HTML <img> değil; alt prop'u yok. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo ? <Image src={logo} style={s.logo} /> : null}
            <View>
              {company.name ? <Text style={s.companyName}>{company.name}</Text> : null}
              {company.address ? <Text style={s.companyLine}>{company.address}</Text> : null}
              {iletisim ? <Text style={s.companyLine}>{iletisim}</Text> : null}
            </View>
          </View>
          <View style={s.docBlock}>
            <Text style={s.docTitle}>TEKLİF</Text>
            <View style={s.docMeta}>
              <Text style={s.docMetaLabel}>Teklif No</Text>
              <Text style={s.docMetaValue}>{v.TeklifNoTam}</Text>
            </View>
            <View style={s.docMeta}>
              <Text style={s.docMetaLabel}>Tarih</Text>
              <Text style={s.docMetaValue}>{gunFormat(v.TeklifTarihi)}</Text>
            </View>
            {v.GecerlilikTarihi ? (
              <View style={s.docMeta}>
                <Text style={s.docMetaLabel}>Geçerlilik</Text>
                <Text style={s.docMetaValue}>{gunFormat(v.GecerlilikTarihi)}</Text>
              </View>
            ) : null}
            {taslak ? <Text style={s.taslak}>KAYDEDİLMEDİ · ÖNİZLEME</Text> : null}
          </View>
        </View>

        {/* Alıcı + konu */}
        <View style={s.infoRow}>
          <View style={[s.infoBox, { marginRight: 8 }]}>
            <Text style={s.infoLabel}>Sayın</Text>
            <Text style={s.infoName}>{v.Kisi.Ad}</Text>
            {v.Kisi.Yetkili ? <Text style={s.infoLine}>{v.Kisi.Yetkili}</Text> : null}
            {v.Kisi.Telefon ? <Text style={s.infoLine}>Tel: {v.Kisi.Telefon}</Text> : null}
            {v.Kisi.Eposta ? <Text style={s.infoLine}>E-posta: {v.Kisi.Eposta}</Text> : null}
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Konu</Text>
            <Text style={s.infoName}>{v.Konu}</Text>
            <Text style={s.infoLine}>Para birimi: {v.ParaBirimi}</Text>
            {v.Hazirlayan ? <Text style={s.infoLine}>Hazırlayan: {v.Hazirlayan}</Text> : null}
          </View>
        </View>

        {v.Aciklama ? <Text style={s.paragraph}>{v.Aciklama}</Text> : null}

        {/* Kalemler */}
        <View style={s.table}>
          <View style={s.thead} fixed>
            <Text style={[s.th, { width: K.no, textAlign: "center" }]}>#</Text>
            <Text style={[s.th, { width: K.kalem }]}>Ürün / Hizmet</Text>
            <Text style={[s.th, { width: K.miktar, textAlign: "right" }]}>Miktar</Text>
            <Text style={[s.th, { width: K.fiyat, textAlign: "right" }]}>Birim Fiyat</Text>
            <Text style={[s.th, { width: K.isk, textAlign: "right" }]}>İsk.</Text>
            <Text style={[s.th, { width: K.kdv, textAlign: "right" }]}>KDV</Text>
            <Text style={[s.th, { width: K.toplam, textAlign: "right" }]}>Tutar</Text>
          </View>
          {v.Kalemler.map((k, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : {}]} wrap={false}>
              <Text style={[s.td, { width: K.no, textAlign: "center", color: MUTED }]}>{i + 1}</Text>
              <View style={[s.td, { width: K.kalem }]}>
                <Text>{k.Aciklama}</Text>
                {k.Detay ? <Text style={s.detay}>{k.Detay}</Text> : null}
              </View>
              <Text style={[s.td, { width: K.miktar, textAlign: "right" }]}>
                {miktar(k.Miktar)} {k.Birim}
              </Text>
              <Text style={[s.td, { width: K.fiyat, textAlign: "right" }]}>{para(k.BirimFiyat)}</Text>
              <Text style={[s.td, { width: K.isk, textAlign: "right" }]}>
                {kalemIskontoMetni(k, v.ParaBirimi) ?? "-"}
              </Text>
              <Text style={[s.td, { width: K.kdv, textAlign: "right" }]}>{oran(k.KdvOrani)}</Text>
              {/* KDV hariç net tutar; KDV toplamlarda gösterilir. */}
              <Text style={[s.td, { width: K.toplam, textAlign: "right" }]}>{para(k.NetTutar)}</Text>
            </View>
          ))}
        </View>

        {/* Toplamlar */}
        <View style={s.totals} wrap={false}>
          {/* Ekrandaki TeklifToplamPaneli ile aynı sıra: yukarıdan aşağı toplanır. */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              Birim Toplamları{satirIskonto > 0 ? ` (satır iskontosu ${para(satirIskonto)} düşüldü)` : ""}
            </Text>
            <Text>{para(t.AraToplam - satirIskonto)}</Text>
          </View>
          {t.GenelIskontoTutari > 0 ? (
            <>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>
                  Genel İskonto{v.GenelIskontoOrani > 0 ? ` (${oran(v.GenelIskontoOrani)})` : ""}
                </Text>
                <Text>− {para(t.GenelIskontoTutari)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Ara Toplam (KDV hariç)</Text>
                <Text>{para(t.AraToplam - satirIskonto - t.GenelIskontoTutari)}</Text>
              </View>
            </>
          ) : null}
          {kdvDagilimi.length ? (
            kdvDagilimi.map((d) => (
              <View key={d.oran} style={s.totalRow}>
                <Text style={s.totalLabel}>KDV ({oran(d.oran)})</Text>
                <Text>{para(d.tutar)}</Text>
              </View>
            ))
          ) : (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>KDV</Text>
              <Text>{para(t.KdvToplam)}</Text>
            </View>
          )}
          <View style={s.grandRow}>
            <Text style={s.grandText}>GENEL TOPLAM</Text>
            <Text style={s.grandText}>{para(t.GenelToplam)}</Text>
          </View>
          {v.ParaBirimi !== "TRY" && v.Kur > 0 ? (
            <Text style={s.tlLine}>
              TL karşılığı (kur {v.Kur.toLocaleString("tr-TR", { maximumFractionDigits: 6 })}):{" "}
              {paraFormat(t.GenelToplam * v.Kur, "TRY")}
            </Text>
          ) : null}
        </View>

        {v.Kosullar ? (
          <View wrap={false}>
            <Text style={s.sectionTitle}>Koşullar</Text>
            <Text style={s.paragraph}>{v.Kosullar}</Text>
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text>{[company.name, `Teklif ${v.TeklifNoTam}`].filter(Boolean).join(" · ")}</Text>
          <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Teklif PDF'ini üretir (şirket bilgisi + logo dahil). */
export async function teklifPdfBlob(v: TeklifPdfVeri): Promise<Blob> {
  registerPdfFont();
  const company = await getCompanyInfo();
  // Logo yüklenemezse PDF'i engelleme, logosuz devam et.
  const logo = await getLogoDataUri(company.logoPath).catch(() => undefined);
  return pdf(<TeklifPdfDocument v={v} company={company} logo={logo} />).toBlob();
}
