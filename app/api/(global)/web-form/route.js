// Web sitesi (qrz-web) formları → CRM Kontak. Oturumsuz, x-api-key ile korunur
// (lib/api-key). SP: /sql/crm_web_form.sql. Kayıtların düştüğü şirket ve
// "oluşturan" kullanıcı istemciden değil bu route'un ayarından gelir.
import { NextResponse } from "next/server";
import { ExecuteQueryRecordsets } from "@/lib/db";
import { ok, fail } from "@/lib/api-session";
import { withApiKey } from "@/lib/api-key";
import {
  GecersizIstek,
  SP_HATA,
  bos,
  exec,
  ilk,
  sqlBit,
  sqlInt,
  sqlNStr,
  sqlStr,
} from "@/lib/sql";

// Web kayıtlarının düştüğü şirket ve kaydı "oluşturan" kullanıcı.
// Gerekirse .env ile değiştirilir.
const WEB_FORM_IDSIRKET = process.env.WEB_FORM_IDSIRKET || "9";
const WEB_FORM_IDKULLANICI = process.env.WEB_FORM_IDKULLANICI || "5";

// Web form türü → CrmKisi.Kaynak
const KAYNAKLAR = { demo: "Web", contact: "Iletisim", partner: "Bayi" };

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SP kolon sınırları; aşan istek reddedilir (sessizce kesilmez).
function uzunluk(p, alan, max, etiket) {
  if (!bos(p[alan]) && String(p[alan]).trim().length > max) {
    throw new GecersizIstek(`${etiket} en fazla ${max} karakter olabilir.`);
  }
}

function webFormDogrula(p) {
  if (!KAYNAKLAR[p.kind]) {
    throw new GecersizIstek("Form türü demo, contact veya partner olmalı.");
  }
  if (!EPOSTA.test(String(p.email).trim())) {
    throw new GecersizIstek("Geçerli bir e-posta girin.");
  }
  uzunluk(p, "name", 200, "Ad soyad");
  uzunluk(p, "company", 200, "Şirket");
  uzunluk(p, "email", 200, "E-posta");
  uzunluk(p, "phone", 50, "Telefon");
  uzunluk(p, "konu", 250, "Konu");
  if (!bos(p.ilKodu) && !/^\d{1,3}$/.test(String(p.ilKodu).trim())) {
    throw new GecersizIstek("Geçersiz il.");
  }
}

// dbo.Il kodları 3 hanelidir ('034'); "34" gelse de aynı kayda eşlensin.
const ilKodu = (v) => (bos(v) ? null : String(v).trim().padStart(3, "0"));

const TURKIYE_ID_ULKE = 38;

/* ------------------------------------------------------------------ */
/* Sorgu tipleri: query → SQL, map → recordset'lerden cevap            */
/* IDSirket ve IDKullanici her zaman bu route'un ayarından gelir.      */
/* ------------------------------------------------------------------ */

const queryTypes = {
  // Web formlarındaki il listesi (Türkiye). IlKodu CRM'e olduğu gibi yazılır.
  // Boş placeholder satırı ("0  ") listeye girmez.
  SELECT_IL_LIST: {
    zorunlu: [],
    query: () => `EXEC [dbo].[Il_SELECTByIDUlke] ${TURKIYE_ID_ULKE}`,
    map: (rs) =>
      (rs[0] ?? [])
        .map((r) => ({ IlKodu: String(r.IlKodu ?? "").trim(), IlAdi: String(r.IlAdi ?? "").trim() }))
        .filter((r) => r.IlAdi && r.IlKodu && Number(r.IlKodu) > 0),
  },

  // Demo / iletişim / bayilik formu. Aynı e-postalı kişi varsa yeni kişi
  // açılmaz, talep o kişiye planlanmış aktivite olarak eklenir.
  INSERT_WEB_FORM: {
    zorunlu: ["kind", "name", "email", "konu"],
    dogrula: webFormDogrula,
    query: (p) =>
      exec("CrmKisi_INSERT_WebForm", {
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        Kaynak: sqlStr(KAYNAKLAR[p.kind]),
        YetkiliKisi: sqlNStr(String(p.name).trim()),
        EPosta: sqlStr(String(p.email).trim()),
        Kurum: sqlNStr(p.company?.trim?.()),
        Telefon: sqlStr(p.phone?.trim?.()),
        IlKodu: sqlStr(ilKodu(p.ilKodu)),
        IletisimIzni: sqlBit(p.iletisimIzni),
        Konu: sqlNStr(String(p.konu).trim()),
        Aciklama: sqlNStr(p.aciklama),
      }),
    map: (rs) => {
      const r = ilk(rs);
      return { IDCrmKisi: r?.IDCrmKisi ?? null, YeniKayit: Boolean(r?.YeniKayit) };
    },
  },
};

export const POST = withApiKey(async (request) => {
  try {
    const payload = await request.json();
    const { type } = payload;
    const tanim = queryTypes[type];

    if (!tanim) {
      return fail(false, "Geçersiz sorgu tipi", 400);
    }

    // Şirket ve kullanıcı istemciden değil, her zaman route ayarından.
    const params = {
      ...(payload.params ?? {}),
      IDSirket: WEB_FORM_IDSIRKET,
      IDKullanici: WEB_FORM_IDKULLANICI,
    };

    const eksik = tanim.zorunlu.filter((k) => bos(params[k]));
    if (eksik.length) {
      return fail(false, `Eksik alan: ${eksik.join(", ")}`, 400, "VALIDATION_ERROR");
    }

    tanim.dogrula?.(params);

    const recordsets = await ExecuteQueryRecordsets(tanim.query(params));
    return ok(false, tanim.map(recordsets));
  } catch (err) {
    // Gövde JSON değilse
    if (err instanceof SyntaxError) {
      return fail(false, "Geçersiz istek gövdesi.", 400, "VALIDATION_ERROR");
    }
    if (err instanceof GecersizIstek) {
      return fail(false, err.message, 400, "VALIDATION_ERROR");
    }

    const spHata = SP_HATA[err?.number];
    if (spHata) {
      return fail(false, err.message, spHata[0], spHata[1]);
    }

    console.error("API Error (web-form):", err);

    return NextResponse.json(
      { message: "Bir hata oluştu. Lütfen tekrar deneyiniz" },
      { status: 500 },
    );
  }
});
