// Kalemli belge PDF'i (@react-pdf/renderer): teklif ve satış aynı şablonu
// kullanır (BelgePdfVeri). Satış belgesinde tahsilat / kalan bilgisi yoktur. Liste export'larıyla aynı renk paleti ve font
// kullanılır. Belge müşteriye QR Zaman adına gider: başlıkta
// oturumdaki şirket değil, QR Zaman logosu ve firma bilgileri (constants/yasal)
// bulunur. Bu modül ağır olduğu için ekranlarda dinamik import edilir
// (bkz. components/teklifler/TeklifPdfOnizleme.tsx).
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { registerPdfFont, PDF_FONT_FAMILY } from "@/components/export/exporters/pdf-exporter";
import { BORDER, MUTED, PRIMARY, PRIMARY_SOFT, ROW_ALT, TEXT } from "@/components/export/exporters/export-theme";
import { YASAL } from "@/constants/yasal";
import { getLogoDataUri } from "@/lib/company";
import { gunFormat, kalemIskontoMetni, kdvDagilimiHesapla, paraFormat } from "@/modules/crm/lib/teklif";
import type { EkstreHesap, EkstrePdfVeri } from "@/modules/crm/types/finans";
import type { BelgePdfAlan, BelgePdfVeri } from "@/modules/crm/types/teklif";

const LOGO_YOLU = "/logos/logo-pri.png";
const MARKA = "QR Zaman";

const s = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 46,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: PDF_FONT_FAMILY,
    color: TEXT,
    backgroundColor: "#FFFFFF",
  },

  /* ---------------- Başlık: solda QR Zaman, sağda belge bilgisi ---------------- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  firma: { maxWidth: "55%" },
  // logo-pri.png 569 × 161 → oran korunur
  logo: { width: 112, height: 32, objectFit: "contain", marginBottom: 6 },
  marka: { fontSize: 16, fontWeight: 700, color: PRIMARY, marginBottom: 4 },
  firmaUnvan: { fontSize: 8, fontWeight: 700 },
  firmaSatir: { fontSize: 7.5, color: MUTED, marginTop: 1.5, lineHeight: 1.3 },

  belge: { alignItems: "flex-end" },
  belgeBaslik: { fontSize: 22, fontWeight: 700, color: PRIMARY, letterSpacing: 2, marginBottom: 4 },
  meta: { flexDirection: "row", marginTop: 2 },
  metaEtiket: { color: MUTED, width: 64, textAlign: "right", marginRight: 8 },
  metaDeger: { fontWeight: 700, minWidth: 70, textAlign: "right" },
  etiket: {
    marginTop: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 7,
    fontWeight: 700,
    borderRadius: 3,
  },
  etiketUyari: { color: "#B45309", backgroundColor: "#FEF3C7" },
  etiketTehlike: { color: "#B91C1C", backgroundColor: "#FEE2E2" },

  /* ---------------- Müşteri: solda ad, sağda bilgiler alt alta ---------------- */
  // Genişlikler sabit: react-pdf'te satır içindeki flex: 1 metinler dikeyde
  // gereksiz boşluk bırakabiliyor.
  kart: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: ROW_ALT,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    borderRadius: 2,
  },
  kartSol: { width: 200, paddingRight: 12 },
  kartEtiket: { fontSize: 7, fontWeight: 700, color: PRIMARY, letterSpacing: 0.6, marginBottom: 3 },
  kartBaslik: { fontSize: 13, fontWeight: 700, lineHeight: 1.25 },
  kartSag: { width: 297 },
  bilgi: { flexDirection: "row", marginBottom: 3 },
  bilgiEtiket: { width: 62, color: MUTED },
  // lineHeight verilmez: satır içi metinde react-pdf satır aralığını çok büyük hesaplıyor.
  bilgiDeger: { width: 235 },

  /* ---------------- Teklif bilgileri (yan yana alanlar) ---------------- */
  alanSatir: { flexDirection: "row" },
  alan: { marginRight: 32 },
  alanEtiket: { fontSize: 7, color: MUTED, marginBottom: 2 },
  alanDeger: { fontWeight: 700 },

  /* ---------------- Bölümler ---------------- */
  bolum: { marginBottom: 14 },
  bolumBaslik: {
    fontSize: 7.5,
    fontWeight: 700,
    color: PRIMARY,
    letterSpacing: 0.6,
    paddingBottom: 3,
    marginBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  paragraf: { lineHeight: 1.45 },

  /* ---------------- Kalem tablosu (export tablolarıyla aynı dil) ---------------- */
  thead: {
    flexDirection: "row",
    backgroundColor: PRIMARY_SOFT,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
  },
  th: { paddingVertical: 5, paddingHorizontal: 5, color: PRIMARY, fontWeight: 700, fontSize: 7.5 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { paddingVertical: 5, paddingHorizontal: 5 },
  kalemAdi: { fontWeight: 700 },
  detay: { fontSize: 7.5, color: MUTED, marginTop: 1.5, lineHeight: 1.3 },
  soluk: { color: MUTED },

  /* ---------------- Toplamlar ---------------- */
  toplamAlan: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10, marginBottom: 16 },
  toplamlar: { width: "48%" },
  toplamSatir: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  toplamEtiket: { color: MUTED },
  toplamNot: { fontSize: 7, color: MUTED, marginTop: 1 },
  genelToplam: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: PRIMARY_SOFT,
    borderTopWidth: 1.5,
    borderTopColor: PRIMARY,
  },
  genelToplamYazi: { color: PRIMARY, fontWeight: 700, fontSize: 11 },
  tlSatir: { fontSize: 7.5, color: MUTED, textAlign: "right", marginTop: 4, paddingHorizontal: 8 },

  /* ---------------- İmza ---------------- */
  imza: { alignItems: "flex-end", marginTop: 8 },
  imzaKutu: { width: 180, alignItems: "center" },
  imzaEtiket: { color: MUTED, marginBottom: 2 },
  imzaFirma: { fontWeight: 700 },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    fontSize: 6.5,
    color: MUTED,
  },
});

// Kolon genişlikleri (toplam 100%)
const K = {
  no: "5%",
  kalem: "37%",
  miktar: "12%",
  fiyat: "15%",
  isk: "9%",
  kdv: "7%",
  toplam: "15%",
} as const;

const miktar = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
const oran = (n: number) => `%${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;

function Meta({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <View style={s.meta}>
      <Text style={s.metaEtiket}>{etiket}</Text>
      <Text style={s.metaDeger}>{deger}</Text>
    </View>
  );
}

function Bilgi({ etiket, deger }: { etiket: string; deger: string | null }) {
  if (!deger) return null;
  return (
    <View style={s.bilgi}>
      <Text style={s.bilgiEtiket}>{etiket}</Text>
      <Text style={s.bilgiDeger}>{deger}</Text>
    </View>
  );
}

function Alan({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <View style={s.alan}>
      <Text style={s.alanEtiket}>{etiket}</Text>
      <Text style={s.alanDeger}>{deger}</Text>
    </View>
  );
}

function ToplamSatir({ etiket, deger, not }: { etiket: string; deger: string; not?: string }) {
  return (
    <View style={s.toplamSatir}>
      <View>
        <Text style={s.toplamEtiket}>{etiket}</Text>
        {not ? <Text style={s.toplamNot}>{not}</Text> : null}
      </View>
      <Text>{deger}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Ortak parçalar (teklif / satış belgesi ve hesap ekstresi)           */
/* ------------------------------------------------------------------ */

const ILETISIM = [`Tel: ${YASAL.DESTEK_TELEFON}`, `E-posta: ${YASAL.DESTEK_EPOSTA}`].join("  ·  ");

/** Solda QR Zaman logosu ve firma bilgileri, sağda belge başlığı + no / tarih satırları. */
function BelgeBasligi({
  baslik,
  meta,
  etiket,
  logo,
}: {
  baslik: string;
  meta: BelgePdfAlan[];
  etiket?: BelgePdfVeri["Etiket"];
  logo?: string;
}) {
  return (
    <View style={s.header}>
      <View style={s.firma}>
        {/* react-pdf Image'ı HTML <img> değil; alt prop'u yok. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {logo ? <Image src={logo} style={s.logo} /> : <Text style={s.marka}>{MARKA}</Text>}
        <Text style={s.firmaUnvan}>{YASAL.SIRKET_UNVANI}</Text>
        <Text style={s.firmaSatir}>{YASAL.SIRKET_ADRES}</Text>
        <Text style={s.firmaSatir}>{ILETISIM}</Text>
      </View>
      <View style={s.belge}>
        <Text style={s.belgeBaslik}>{baslik}</Text>
        {meta.map((m) => (
          <Meta key={m.etiket} etiket={m.etiket} deger={m.deger} />
        ))}
        {etiket ? (
          <Text style={[s.etiket, etiket.tur === "tehlike" ? s.etiketTehlike : s.etiketUyari]}>{etiket.metin}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Müşteri: solda büyük ad, sağda bilgiler alt alta. */
function MusteriKarti({ kisi }: { kisi: BelgePdfVeri["Kisi"] }) {
  return (
    <View style={s.kart} wrap={false}>
      <View style={s.kartSol}>
        <Text style={s.kartEtiket}>MÜŞTERİ</Text>
        <Text style={s.kartBaslik}>{kisi.Ad}</Text>
      </View>
      <View style={s.kartSag}>
        <Bilgi etiket="Yetkili" deger={kisi.Yetkili} />
        {kisi.VergiNo ? (
          <Bilgi etiket="Vergi No" deger={kisi.VergiNo} />
        ) : (
          <Bilgi etiket="TC Kimlik No" deger={kisi.TcKimlikNo} />
        )}
        <Bilgi etiket="Telefon" deger={kisi.Telefon} />
        <Bilgi etiket="E-posta" deger={kisi.Eposta} />
        <Bilgi etiket="Adres" deger={kisi.Adres} />
      </View>
    </View>
  );
}

/** Her sayfanın altında: solda marka, sağda belge + sayfa no. */
function AltBilgi({ belge }: { belge: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{`${MARKA} · ${YASAL.SIRKET_UNVANI}`}</Text>
      <Text render={({ pageNumber, totalPages }) => `${belge} · Sayfa ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Teklif / satış belgesi                                              */
/* ------------------------------------------------------------------ */

function BelgePdfDocument({ v, logo }: { v: BelgePdfVeri; logo?: string }) {
  const para = (n: number) => paraFormat(n, v.ParaBirimi);
  const t = v.Toplamlar;
  const satirIskonto = Math.max(t.IskontoToplam - t.GenelIskontoTutari, 0);
  const net = t.AraToplam - satirIskonto;
  const kdvDagilimi = kdvDagilimiHesapla(v.Kalemler, {
    GenelIskontoOrani: v.GenelIskontoOrani,
    GenelIskontoTutari: t.GenelIskontoTutari,
  });
  const baslik = v.BelgeAdi.toLocaleUpperCase("tr");

  return (
    <Document title={`${v.BelgeAdi} ${v.BelgeNo}`} author={MARKA}>
      <Page size="A4" style={s.page}>
        <BelgeBasligi baslik={baslik} meta={v.Meta} etiket={v.Etiket} logo={logo} />
        <MusteriKarti kisi={v.Kisi} />

        {/* Belge bilgileri */}
        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>{`${baslik} BİLGİLERİ`}</Text>
          <View style={s.alanSatir}>
            {v.Bilgiler.map((b) => (
              <Alan key={b.etiket} etiket={b.etiket} deger={b.deger} />
            ))}
          </View>
        </View>

        {v.Aciklama ? (
          <View style={s.bolum}>
            <Text style={s.bolumBaslik}>AÇIKLAMA</Text>
            <Text style={s.paragraf}>{v.Aciklama}</Text>
          </View>
        ) : null}

        {/* Kalemler */}
        <View>
          {/* Sayfa taşarsa başlık her sayfada tekrar eder. */}
          <View style={s.thead} fixed>
            <Text style={[s.th, { width: K.no, textAlign: "center" }]}>#</Text>
            <Text style={[s.th, { width: K.kalem }]}>Ürün / Hizmet</Text>
            <Text style={[s.th, { width: K.miktar, textAlign: "right" }]}>Miktar</Text>
            <Text style={[s.th, { width: K.fiyat, textAlign: "right" }]}>Birim Fiyat</Text>
            <Text style={[s.th, { width: K.isk, textAlign: "right" }]}>İskonto</Text>
            <Text style={[s.th, { width: K.kdv, textAlign: "right" }]}>KDV</Text>
            <Text style={[s.th, { width: K.toplam, textAlign: "right" }]}>Tutar</Text>
          </View>
          {v.Kalemler.map((k, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : {}]} wrap={false}>
              <Text style={[s.td, s.soluk, { width: K.no, textAlign: "center" }]}>{i + 1}</Text>
              <View style={[s.td, { width: K.kalem }]}>
                <Text style={s.kalemAdi}>{k.Aciklama}</Text>
                {k.Detay ? <Text style={s.detay}>{k.Detay}</Text> : null}
              </View>
              <Text style={[s.td, { width: K.miktar, textAlign: "right" }]}>
                {miktar(k.Miktar)} {k.Birim}
              </Text>
              <Text style={[s.td, { width: K.fiyat, textAlign: "right" }]}>{para(k.BirimFiyat)}</Text>
              <Text style={[s.td, { width: K.isk, textAlign: "right" }, k.IskontoTutari > 0 ? {} : s.soluk]}>
                {kalemIskontoMetni(k, v.ParaBirimi) ?? "-"}
              </Text>
              <Text style={[s.td, { width: K.kdv, textAlign: "right" }]}>{oran(k.KdvOrani)}</Text>
              {/* KDV hariç net tutar; KDV toplamlarda gösterilir. */}
              <Text style={[s.td, { width: K.toplam, textAlign: "right", fontWeight: 700 }]}>{para(k.NetTutar)}</Text>
            </View>
          ))}
        </View>

        {/* Toplamlar: ekrandaki TeklifToplamPaneli ile aynı sıra, yukarıdan aşağı toplanır. */}
        <View style={s.toplamAlan} wrap={false}>
          <View style={s.toplamlar}>
            <ToplamSatir
              etiket="Birim Toplamları"
              deger={para(net)}
              not={satirIskonto > 0 ? `Satır iskontosu ${para(satirIskonto)} düşüldü` : undefined}
            />
            {t.GenelIskontoTutari > 0 ? (
              <>
                <ToplamSatir
                  etiket={`Genel İskonto${v.GenelIskontoOrani > 0 ? ` (${oran(v.GenelIskontoOrani)})` : ""}`}
                  deger={`− ${para(t.GenelIskontoTutari)}`}
                />
                <ToplamSatir etiket="Ara Toplam (KDV hariç)" deger={para(net - t.GenelIskontoTutari)} />
              </>
            ) : null}
            {kdvDagilimi.length ? (
              kdvDagilimi.map((d) => <ToplamSatir key={d.oran} etiket={`KDV (${oran(d.oran)})`} deger={para(d.tutar)} />)
            ) : (
              <ToplamSatir etiket="KDV" deger={para(t.KdvToplam)} />
            )}
            <View style={s.genelToplam}>
              <Text style={s.genelToplamYazi}>GENEL TOPLAM</Text>
              <Text style={s.genelToplamYazi}>{para(t.GenelToplam)}</Text>
            </View>
            {v.ParaBirimi !== "TRY" && v.Kur > 0 ? (
              <Text style={s.tlSatir}>
                TL karşılığı (kur {v.Kur.toLocaleString("tr-TR", { maximumFractionDigits: 6 })}):{" "}
                {paraFormat(t.GenelToplam * v.Kur, "TRY")}
              </Text>
            ) : null}
          </View>
        </View>

        {v.Kosullar ? (
          <View style={s.bolum} wrap={false}>
            <Text style={s.bolumBaslik}>KOŞULLAR</Text>
            <Text style={s.paragraf}>{v.Kosullar}</Text>
          </View>
        ) : null}

        <View style={s.imza} wrap={false}>
          <View style={s.imzaKutu}>
            <Text style={s.imzaEtiket}>Saygılarımızla,</Text>
            <Text style={s.imzaFirma}>{MARKA}</Text>
          </View>
        </View>

        <AltBilgi belge={`${v.BelgeAdi} ${v.BelgeNo}`} />
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Hesap ekstresi                                                      */
/* ------------------------------------------------------------------ */

const E = { tarih: "12%", belge: "15%", aciklama: "34%", borc: "13%", alacak: "13%", bakiye: "13%" } as const;

/** Bakiye yönü: artı → müşteri borçlu, eksi → müşteri alacaklı (fazla ödeme). */
const bakiyeYonu = (n: number) => (n > 0 ? "Borç" : n < 0 ? "Alacak" : "");

function EkstreTablosu({ h, devredenVar, coklu }: { h: EkstreHesap; devredenVar: boolean; coklu: boolean }) {
  const para = (n: number) => paraFormat(n, h.ParaBirimi);
  const tutar = (n: number) => (n ? para(n) : "");
  const sag = { textAlign: "right" as const };

  return (
    <View style={s.bolum}>
      {coklu ? <Text style={s.bolumBaslik}>{`${h.ParaBirimi} HESABI`}</Text> : null}
      {/* Tek tabloda başlık her sayfada tekrar eder; birden çok para biriminde
          tekrar eden başlıklar üst üste bineceği için tekrarlanmaz. */}
      <View style={s.thead} fixed={!coklu}>
        <Text style={[s.th, { width: E.tarih }]}>Tarih</Text>
        <Text style={[s.th, { width: E.belge }]}>Belge No</Text>
        <Text style={[s.th, { width: E.aciklama }]}>Açıklama</Text>
        <Text style={[s.th, sag, { width: E.borc }]}>Borç</Text>
        <Text style={[s.th, sag, { width: E.alacak }]}>Alacak</Text>
        <Text style={[s.th, sag, { width: E.bakiye }]}>Bakiye</Text>
      </View>
      {devredenVar ? (
        <View style={[s.tr, s.trAlt]} wrap={false}>
          <Text style={[s.td, { width: E.tarih }]} />
          <Text style={[s.td, { width: E.belge }]} />
          <Text style={[s.td, s.kalemAdi, { width: E.aciklama }]}>Devreden bakiye</Text>
          <Text style={[s.td, { width: E.borc }]} />
          <Text style={[s.td, { width: E.alacak }]} />
          <Text style={[s.td, sag, s.kalemAdi, { width: E.bakiye }]}>{para(h.Devreden)}</Text>
        </View>
      ) : null}
      {h.Hareketler.map((r, i) => (
        <View key={i} style={[s.tr, (i + (devredenVar ? 1 : 0)) % 2 === 1 ? s.trAlt : {}]} wrap={false}>
          <Text style={[s.td, { width: E.tarih }]}>{gunFormat(r.Tarih)}</Text>
          <Text style={[s.td, { width: E.belge }]}>{r.BelgeNo}</Text>
          <Text style={[s.td, { width: E.aciklama }]}>{r.Aciklama}</Text>
          <Text style={[s.td, sag, { width: E.borc }]}>{tutar(r.Borc)}</Text>
          <Text style={[s.td, sag, { width: E.alacak }]}>{tutar(r.Alacak)}</Text>
          <Text style={[s.td, sag, s.kalemAdi, { width: E.bakiye }]}>{para(r.Bakiye)}</Text>
        </View>
      ))}
      {!h.Hareketler.length ? (
        <View style={s.tr}>
          <Text style={[s.td, s.soluk, { width: "100%", textAlign: "center" }]}>Bu dönemde hareket yok.</Text>
        </View>
      ) : null}

      <View style={s.toplamAlan} wrap={false}>
        <View style={s.toplamlar}>
          {devredenVar ? <ToplamSatir etiket="Devreden" deger={para(h.Devreden)} /> : null}
          <ToplamSatir etiket="Toplam Borç" deger={para(h.ToplamBorc)} />
          <ToplamSatir etiket="Toplam Alacak" deger={para(h.ToplamAlacak)} />
          <View style={s.genelToplam}>
            <Text style={s.genelToplamYazi}>BAKİYE</Text>
            <Text style={s.genelToplamYazi}>
              {para(Math.abs(h.Bakiye))}
              {bakiyeYonu(h.Bakiye) ? ` (${bakiyeYonu(h.Bakiye)})` : ""}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function EkstrePdfDocument({ v, logo }: { v: EkstrePdfVeri; logo?: string }) {
  return (
    <Document title={`Hesap Ekstresi ${v.Kisi.Ad}`} author={MARKA}>
      <Page size="A4" style={s.page}>
        <BelgeBasligi
          baslik="HESAP EKSTRESİ"
          meta={[
            { etiket: "Tarih", deger: gunFormat(v.Tarih) },
            { etiket: "Dönem", deger: v.Donem },
          ]}
          logo={logo}
        />
        <MusteriKarti kisi={v.Kisi} />

        {v.Hesaplar.length ? (
          v.Hesaplar.map((h) => (
            <EkstreTablosu key={h.ParaBirimi} h={h} devredenVar={v.DevredenVar} coklu={v.Hesaplar.length > 1} />
          ))
        ) : (
          <Text style={[s.paragraf, s.soluk]}>Bu dönemde hesap hareketi yok.</Text>
        )}

        <Text style={[s.toplamNot, { marginBottom: 10 }]}>
          Borç bakiyesi tarafımıza ödenecek tutarı, alacak bakiyesi fazla ödemenizi gösterir. Kayıtlarınızla
          mutabakat sağlanamazsa lütfen bizimle iletişime geçiniz.
        </Text>

        <View style={s.imza} wrap={false}>
          <View style={s.imzaKutu}>
            <Text style={s.imzaEtiket}>Saygılarımızla,</Text>
            <Text style={s.imzaFirma}>{MARKA}</Text>
          </View>
        </View>

        <AltBilgi belge="Hesap Ekstresi" />
      </Page>
    </Document>
  );
}

/** Hesap ekstresi PDF'ini üretir. */
export async function ekstrePdfBlob(v: EkstrePdfVeri): Promise<Blob> {
  registerPdfFont();
  const logo = await getLogoDataUri(LOGO_YOLU).catch(() => undefined);
  return pdf(<EkstrePdfDocument v={v} logo={logo} />).toBlob();
}

/** Teklif / satış PDF'ini üretir (QR Zaman logosu dahil). */
export async function belgePdfBlob(v: BelgePdfVeri): Promise<Blob> {
  registerPdfFont();
  // Logo yüklenemezse PDF'i engelleme, logo yerine marka adı yazılır.
  const logo = await getLogoDataUri(LOGO_YOLU).catch(() => undefined);
  return pdf(<BelgePdfDocument v={v} logo={logo} />).toBlob();
}
