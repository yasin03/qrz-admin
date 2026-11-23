// CRM (kişi: kontak / müşteri, aktivite: görüşme + randevu) API'si.
// SP'ler: /sql/crm_duzeltme.sql — planlanan aktiviteler Ajanda'ya bağlıdır
// (takvim kaydını SP'ler açar/günceller, burada ayrıca Ajanda çağrılmaz).
import { NextResponse } from "next/server";
import { ExecuteQueryRecordsets } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

/* ------------------------------------------------------------------ */
/* SQL değer yardımcıları — boş değer NULL olarak gider                */
/* ------------------------------------------------------------------ */

const bos = (v) => v === undefined || v === null || v === "";

// Serbest metin: N'' öneki Türkçe karakter / unicode kaybolmasın diye
// (kolon varchar olsa da Turkish collation'a doğru çevrilir).
function sqlNStr(v) {
  return bos(v) ? "NULL" : `N'${String(v).replace(/'/g, "''")}'`;
}

// Kod değerleri (Tip, IlKodu, GorusmeAraci ...).
function sqlStr(v) {
  return bos(v) ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
}

function sqlInt(v) {
  if (bos(v)) return "NULL";
  const n = Number(v);
  if (!Number.isInteger(n)) throw new GecersizIstek(`Geçersiz sayı: ${v}`);
  return String(n);
}

// Boş → NULL (SP mevcut değeri korur / varsayılanı kullanır).
function sqlBitN(v) {
  if (bos(v)) return "NULL";
  return v === true || v === 1 || v === "1" || v === "true" ? "1" : "0";
}

// Tarihler TR yerel saatidir. "2026-11-20T14:00:00.000Z" gelse de Z yok
// sayılır (lib/format.ts ile aynı konvansiyon).
const TARIH = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(:\d{2})?(?:\.\d+)?)?Z?$/;

function sqlDate(v) {
  if (bos(v)) return "NULL";
  const m = String(v).match(TARIH);
  if (!m) throw new GecersizIstek(`Geçersiz tarih: ${v}`);
  return `'${m[1]} ${m[2] ?? "00:00"}${m[3] ?? ":00"}'`;
}

class GecersizIstek extends Error {}

// EXEC [SP] @A = x, @B = y — undefined değerler gönderilmez (SP varsayılanı).
function exec(sp, args) {
  const list = Object.entries(args)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `@${k} = ${v}`);
  return `EXEC [dbo].[${sp}] ${list.join(", ")}`;
}

// Alan hiç gönderilmediyse parametreyi atla (INSERT'te SP varsayılanı devreye girsin).
const opt = (p, key, fn) => (p[key] === undefined ? undefined : fn(p[key]));

const KISI_TIPLERI = ["Kontak", "Musteri"];
const KISI_TURLERI = [1, 2]; // 1 Gerçek kişi, 2 Tüzel kişi

function kisiDogrula(p) {
  if (bos(p.Kurum) && bos(p.YetkiliKisi)) {
    throw new GecersizIstek("Kurum veya yetkili kişi adı zorunlu.");
  }
  if (!bos(p.KisiTuru) && !KISI_TURLERI.includes(Number(p.KisiTuru))) {
    throw new GecersizIstek("Kişi türü 1 (Gerçek) veya 2 (Tüzel) olmalı.");
  }
}

// CrmKisi_INSERT / CrmKisi_UPDATE_ByID ortak alanları.
function kisiAlanlari(p) {
  return {
    Kurum: sqlNStr(p.Kurum),
    YetkiliKisi: sqlNStr(p.YetkiliKisi),
    YetkiliKisiPozisyonu: sqlNStr(p.YetkiliKisiPozisyonu),
    YetkiliKisiTel: sqlStr(p.YetkiliKisiTel),
    YetkiliKisiEPostaAdresi: sqlStr(p.YetkiliKisiEPostaAdresi),
    Adres: sqlNStr(p.Adres),
    IlKodu: sqlStr(p.IlKodu),
    KisiTuru: sqlInt(p.KisiTuru),
    VergiNo: sqlStr(p.VergiNo),
    TcKimlikNo: sqlStr(p.TcKimlikNo),
    CepTelefon: sqlStr(p.CepTelefon),
    Fax: sqlStr(p.Fax),
    WebSitesi: sqlStr(p.WebSitesi),
    Linkedin: sqlStr(p.Linkedin),
    Facebook: sqlStr(p.Facebook),
    Twitter: sqlStr(p.Twitter),
    Instagram: sqlStr(p.Instagram),
    Notlar: sqlNStr(p.Notlar),
    Kaynak: sqlNStr(p.Kaynak),
  };
}

// İzin bayrakları ve Durum: INSERT'te gönderilmezse SP varsayılanı (1).
const kisiBayraklari = (p) => ({
  EmailKabul: opt(p, "EmailKabul", sqlBitN),
  SmsKabul: opt(p, "SmsKabul", sqlBitN),
  AramaKabul: opt(p, "AramaKabul", sqlBitN),
  WhatsappKabul: opt(p, "WhatsappKabul", sqlBitN),
  Durum: opt(p, "Durum", sqlBitN),
});

// CrmAktivite_INSERT / CrmAktivite_UPDATE_ByID ortak alanları.
function aktiviteAlanlari(p) {
  return {
    Tarih: sqlDate(p.Tarih),
    Sure: sqlInt(p.Sure),
    GorusmeAraci: sqlStr(p.GorusmeAraci),
    Konu: sqlNStr(p.Konu),
    Aciklama: sqlNStr(p.Aciklama),
    HatirlatmaDakika: sqlInt(p.HatirlatmaDakika),
    HatirlatmaKanal: sqlInt(p.HatirlatmaKanal),
  };
}

const ilk = (rs, i = 0) => rs?.[i]?.[0] ?? null;

/* ------------------------------------------------------------------ */
/* Sorgu tipleri: query → SQL, map → recordset'lerden cevap            */
/* IDKullanici ve IDSirket her zaman session'dan gelir.                */
/* ------------------------------------------------------------------ */

const queryTypes = {
  /* ---------------- Kişi (kontak / müşteri) ---------------- */

  // Tip = 'Kontak' | 'Musteri'
  SELECT_KISI_LIST: {
    zorunlu: ["Tip"],
    dogrula: (p) => {
      if (!KISI_TIPLERI.includes(p.Tip)) {
        throw new GecersizIstek("Tip 'Kontak' veya 'Musteri' olmalı.");
      }
    },
    query: (p) =>
      exec("CrmKisi_SELECT", {
        IDSirket: sqlInt(p.IDSirket),
        Tip: sqlStr(p.Tip),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Varsayılan Tip = 'Kontak'. Kaynak 'WebSayfası' / 'İletişim' ise SP
  // otomatik görüşme açar (İletişim formunda mesaj → IletisimNotu).
  INSERT_KISI: {
    zorunlu: [],
    dogrula: kisiDogrula,
    query: (p) =>
      exec("CrmKisi_INSERT", {
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        Tip: opt(p, "Tip", sqlStr),
        ...kisiAlanlari(p),
        KisiTuru: opt(p, "KisiTuru", sqlInt),
        ...kisiBayraklari(p),
        IletisimNotu: sqlNStr(p.IletisimNotu),
      }),
    map: (rs) => ({ IDCrmKisi: ilk(rs)?.IDCrmKisi ?? null }),
  },

  // Formdaki tüm alanlar gönderilmeli (boş gönderilen alan NULL olur).
  // KisiTuru / Durum boşsa mevcut değer korunur. Tip burada değişmez.
  UPDATE_KISI: {
    zorunlu: ["IDCrmKisi"],
    dogrula: kisiDogrula,
    query: (p) =>
      exec("CrmKisi_UPDATE_ByID", {
        IDCrmKisi: sqlInt(p.IDCrmKisi),
        IDSirket: sqlInt(p.IDSirket),
        ...kisiAlanlari(p),
        EmailKabul: sqlBitN(p.EmailKabul),
        SmsKabul: sqlBitN(p.SmsKabul),
        AramaKabul: sqlBitN(p.AramaKabul),
        WhatsappKabul: sqlBitN(p.WhatsappKabul),
        Durum: sqlBitN(p.Durum),
      }),
    map: () => ({ success: true }),
  },

  // Kontak → Müşteri (aktiviteler aynı kişiye bağlı kalır).
  UPDATE_KISI_MUSTERIYE_DONUSTUR: {
    zorunlu: ["IDCrmKisi"],
    query: (p) =>
      exec("CrmKisi_UPDATE_MusteriyeDonustur", {
        IDCrmKisi: sqlInt(p.IDCrmKisi),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: () => ({ success: true }),
  },

  // Kişiyi aktiviteleriyle siler; bağlı takvim kayıtları da kalkar.
  DELETE_KISI: {
    zorunlu: ["IDCrmKisi"],
    query: (p) =>
      exec("CrmKisi_DELETE_ByID", {
        IDCrmKisi: sqlInt(p.IDCrmKisi),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: () => ({ success: true }),
  },

  /* ---------------- Aktivite (görüşme + randevu) ---------------- */

  // Zaman çizelgesi. IDCrmKisi boş → şirketin tüm aktiviteleri.
  // Durum boş → hepsi; 0 Planlandı, 1 Yapıldı, 2 İptal.
  SELECT_AKTIVITE_LIST: {
    zorunlu: [],
    query: (p) =>
      exec("CrmAktivite_SELECT", {
        IDSirket: sqlInt(p.IDSirket),
        IDCrmKisi: sqlInt(p.IDCrmKisi ?? 0),
        Durum: sqlInt(p.Durum),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Yaklaşan + gecikmiş randevular. Benim = true → sadece oturumdaki kullanıcı.
  SELECT_AKTIVITE_YAKLASAN: {
    zorunlu: [],
    query: (p) =>
      exec("CrmAktivite_SELECT_Yaklasan", {
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlBitN(p.Benim) === "1" ? sqlInt(p.IDKullanici) : "NULL",
        Gun: sqlInt(p.Gun ?? 7),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Takvimden CRM'e geçiş: ajanda kaydının bağlı olduğu aktivite (yoksa null).
  SELECT_AKTIVITE_BY_AJANDA: {
    zorunlu: ["IDAjanda"],
    query: (p) =>
      exec("CrmAktivite_SELECT_ByIDAjanda", {
        IDAjanda: sqlInt(p.IDAjanda),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: (rs) => ilk(rs),
  },

  // Durum = 1 → yapılmış görüşme, Durum = 0 → randevu (takvime düşer).
  INSERT_AKTIVITE: {
    zorunlu: ["IDCrmKisi", "Tarih"],
    query: (p) =>
      exec("CrmAktivite_INSERT", {
        IDCrmKisi: sqlInt(p.IDCrmKisi),
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        Durum: sqlInt(p.Durum ?? 1),
        ...aktiviteAlanlari(p),
      }),
    map: (rs) => ({
      IDCrmAktivite: ilk(rs)?.IDCrmAktivite ?? null,
      IDAjanda: ilk(rs)?.IDAjanda ?? null,
    }),
  },

  // Formdaki tüm alanlar gönderilmeli. Durum değişmez (TAMAMLA / IPTAL).
  UPDATE_AKTIVITE: {
    zorunlu: ["IDCrmAktivite", "Tarih"],
    query: (p) =>
      exec("CrmAktivite_UPDATE_ByID", {
        IDCrmAktivite: sqlInt(p.IDCrmAktivite),
        IDSirket: sqlInt(p.IDSirket),
        ...aktiviteAlanlari(p),
      }),
    map: () => ({ success: true }),
  },

  // Randevu → görüşme. Aciklama / Sure / Tarih boşsa mevcut değer kalır.
  UPDATE_AKTIVITE_TAMAMLA: {
    zorunlu: ["IDCrmAktivite"],
    query: (p) =>
      exec("CrmAktivite_UPDATE_Tamamla", {
        IDCrmAktivite: sqlInt(p.IDCrmAktivite),
        IDSirket: sqlInt(p.IDSirket),
        Aciklama: sqlNStr(p.Aciklama),
        Sure: sqlInt(p.Sure),
        Tarih: sqlDate(p.Tarih),
      }),
    map: () => ({ success: true }),
  },

  UPDATE_AKTIVITE_IPTAL: {
    zorunlu: ["IDCrmAktivite"],
    query: (p) =>
      exec("CrmAktivite_UPDATE_Iptal", {
        IDCrmAktivite: sqlInt(p.IDCrmAktivite),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: () => ({ success: true }),
  },

  DELETE_AKTIVITE: {
    zorunlu: ["IDCrmAktivite"],
    query: (p) =>
      exec("CrmAktivite_DELETE_ByID", {
        IDCrmAktivite: sqlInt(p.IDCrmAktivite),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: () => ({ success: true }),
  },
};

// SP içindeki THROW kodları → HTTP durumu.
const SP_HATA = {
  50001: [403, "FORBIDDEN"],
  50002: [404, "NOT_FOUND"],
  50003: [400, "VALIDATION_ERROR"],
};

export const POST = withSession(async (request, session) => {
  try {
    const payload = await request.json();
    const { type } = payload;
    const tanim = queryTypes[type];

    if (!tanim) {
      return fail(session.isMobile, "Geçersiz sorgu tipi", 400);
    }

    if (bos(session.user.IDSirket)) {
      return fail(
        session.isMobile,
        "Lütfen önce üstten şirket seçimi yapın.",
        400,
        "VALIDATION_ERROR",
      );
    }

    // IDKullanici ve IDSirket client'tan değil, her zaman oturumdan.
    const params = {
      ...(payload.params ?? {}),
      IDKullanici: session.user.IDKullanici,
      IDSirket: session.user.IDSirket,
    };

    const eksik = tanim.zorunlu.filter((k) => bos(params[k]));
    if (eksik.length) {
      return fail(
        session.isMobile,
        `Eksik alan: ${eksik.join(", ")}`,
        400,
        "VALIDATION_ERROR",
      );
    }

    tanim.dogrula?.(params);

    const recordsets = await ExecuteQueryRecordsets(tanim.query(params));
    return ok(session.isMobile, tanim.map(recordsets));
  } catch (err) {
    if (err instanceof GecersizIstek) {
      return fail(session.isMobile, err.message, 400, "VALIDATION_ERROR");
    }

    const spHata = SP_HATA[err?.number];
    if (spHata) {
      return fail(session.isMobile, err.message, spHata[0], spHata[1]);
    }

    console.error("API Error (crm):", err);

    if (session.isMobile) {
      return fail(
        true,
        "Bir hata oluştu. Lütfen tekrar deneyiniz",
        500,
        "SERVER_ERROR",
      );
    }

    return NextResponse.json(
      {
        message: "Bir hata oluştu. Lütfen tekrar deneyiniz",
        error: err.message,
      },
      { status: 500 },
    );
  }
});
