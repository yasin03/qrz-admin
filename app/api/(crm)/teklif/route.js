// CRM teklif API'si (başlık + kalemler, durum akışı, revizyon).
// SP'ler: /sql/crm_teklif.sql
// Tutarlar FE'de hesaplanır (modules/crm/lib/teklif.ts → teklifHesapla) ve
// burada sadece biçim / aralık kontrolünden geçip olduğu gibi yazılır.
//
// Durum: 0 Taslak, 1 Gönderildi, 2 Kabul, 3 Red, 4 İptal, 5 Revize edildi
import { NextResponse } from "next/server";
import { PARA_BIRIMI_KODLARI } from "@/constants/data";
import { ExecuteQueryRecordsets } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";
import {
  GecersizIstek,
  SP_HATA,
  bos,
  exec,
  gunAl,
  ilk,
  opt,
  sqlBitN,
  sqlDec,
  sqlGun,
  sqlInt,
  sqlNStr,
  sqlStr,
} from "@/lib/sql";

/* ------------------------------------------------------------------ */
/* Doğrulama                                                           */
/* ------------------------------------------------------------------ */

const DURUMLAR = [0, 1, 2, 3, 4, 5];

function sayi(v, alan, { min, max, zorunlu = true, sifirHaric = false } = {}) {
  if (bos(v)) {
    if (zorunlu) throw new GecersizIstek(`${alan} zorunlu.`);
    return null;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) throw new GecersizIstek(`${alan} sayı olmalı.`);
  if (min !== undefined && (sifirHaric ? n <= min : n < min)) {
    throw new GecersizIstek(`${alan} ${sifirHaric ? `${min}'dan büyük` : `en az ${min}`} olmalı.`);
  }
  if (max !== undefined && n > max) throw new GecersizIstek(`${alan} en fazla ${max} olabilir.`);
  return n;
}

const oran = (v, alan) => sayi(v, alan, { min: 0, max: 100, zorunlu: false }) ?? 0;

/**
 * Kalemleri doğrular ve SP'nin beklediği JSON'a çevirir. Sadece bilinen
 * alanlar geçer; sayılar Number olarak yazılır (OPENJSON decimal okur).
 */
function kalemlerJson(kalemler) {
  if (!Array.isArray(kalemler) || kalemler.length === 0) {
    throw new GecersizIstek("Teklifte en az bir kalem olmalı.");
  }

  const temiz = kalemler.map((k, i) => {
    const sira = i + 1;
    const etiket = (alan) => `${sira}. kalem: ${alan}`;
    const aciklama = String(k?.Aciklama ?? "").trim();
    if (!aciklama) throw new GecersizIstek(etiket("açıklama zorunlu."));
    if (aciklama.length > 500) throw new GecersizIstek(etiket("açıklama en fazla 500 karakter."));
    const detay = bos(k.Detay) ? null : String(k.Detay).trim();
    if (detay && detay.length > 1000) throw new GecersizIstek(etiket("detay en fazla 1000 karakter."));
    const birim = bos(k.Birim) ? "Adet" : String(k.Birim).trim();
    if (birim.length > 20) throw new GecersizIstek(etiket("birim en fazla 20 karakter."));

    return {
      SiraNo: sira,
      Aciklama: aciklama,
      Detay: detay || null,
      Miktar: sayi(k.Miktar, etiket("miktar"), { min: 0, sifirHaric: true }),
      Birim: birim,
      BirimFiyat: sayi(k.BirimFiyat, etiket("birim fiyat"), { min: 0 }),
      IskontoOrani: oran(k.IskontoOrani, etiket("iskonto oranı")),
      KdvOrani: oran(k.KdvOrani, etiket("KDV oranı")),
      Tutar: sayi(k.Tutar, etiket("tutar")),
      IskontoTutari: sayi(k.IskontoTutari, etiket("iskonto tutarı"), { zorunlu: false }) ?? 0,
      NetTutar: sayi(k.NetTutar, etiket("net tutar")),
      KdvTutari: sayi(k.KdvTutari, etiket("KDV tutarı"), { zorunlu: false }) ?? 0,
      ToplamTutar: sayi(k.ToplamTutar, etiket("toplam tutar")),
    };
  });

  return sqlNStr(JSON.stringify(temiz));
}

// INSERT / UPDATE ortak kontrolleri.
function teklifDogrula(p) {
  const konu = String(p.Konu ?? "").trim();
  if (!konu) throw new GecersizIstek("Konu zorunlu.");
  if (konu.length > 250) throw new GecersizIstek("Konu en fazla 250 karakter olabilir.");

  const teklifTarihi = gunAl(p.TeklifTarihi);
  const gecerlilik = gunAl(p.GecerlilikTarihi);
  if (gecerlilik && gecerlilik < teklifTarihi) {
    throw new GecersizIstek("Geçerlilik tarihi teklif tarihinden önce olamaz.");
  }

  const paraBirimi = bos(p.ParaBirimi) ? "TRY" : String(p.ParaBirimi).toUpperCase();
  if (!PARA_BIRIMI_KODLARI.includes(paraBirimi)) {
    throw new GecersizIstek(`Para birimi ${PARA_BIRIMI_KODLARI.join(", ")} olmalı.`);
  }
  if (paraBirimi !== "TRY") sayi(p.Kur, "Kur", { min: 0, sifirHaric: true });

  oran(p.GenelIskontoOrani, "Genel iskonto oranı");
  sayi(p.AraToplam, "Ara toplam");
  sayi(p.KdvToplam, "KDV toplamı");
  sayi(p.GenelToplam, "Genel toplam");

  if (!bos(p.RedNedeni) && String(p.RedNedeni).length > 500) {
    throw new GecersizIstek("Red nedeni en fazla 500 karakter olabilir.");
  }
}

// CrmTeklif_INSERT / CrmTeklif_UPDATE_ByID ortak alanları.
function teklifAlanlari(p) {
  const paraBirimi = bos(p.ParaBirimi) ? "TRY" : String(p.ParaBirimi).toUpperCase();
  return {
    IDCrmKisi: sqlInt(p.IDCrmKisi),
    Konu: sqlNStr(String(p.Konu).trim()),
    TeklifTarihi: sqlGun(p.TeklifTarihi),
    GecerlilikTarihi: sqlGun(p.GecerlilikTarihi),
    ParaBirimi: sqlStr(paraBirimi),
    Kur: paraBirimi === "TRY" ? "1" : sqlDec(p.Kur),
    GenelIskontoOrani: sqlDec(p.GenelIskontoOrani ?? 0),
    AraToplam: sqlDec(p.AraToplam),
    GenelIskontoTutari: sqlDec(p.GenelIskontoTutari ?? 0),
    IskontoToplam: sqlDec(p.IskontoToplam ?? 0),
    KdvToplam: sqlDec(p.KdvToplam),
    GenelToplam: sqlDec(p.GenelToplam),
    Aciklama: sqlNStr(p.Aciklama),
    Kosullar: sqlNStr(p.Kosullar),
    Kalemler: kalemlerJson(p.Kalemler),
  };
}

// Sadece ID + şirket alan durum SP'leri.
const idIle = (sp, kullaniciIle = false) => ({
  zorunlu: ["IDCrmTeklif"],
  query: (p) =>
    exec(sp, {
      IDCrmTeklif: sqlInt(p.IDCrmTeklif),
      IDSirket: sqlInt(p.IDSirket),
      ...(kullaniciIle ? { IDKullanici: sqlInt(p.IDKullanici) } : {}),
    }),
  map: () => ({ success: true }),
});

/* ------------------------------------------------------------------ */
/* Sorgu tipleri: query → SQL, map → recordset'lerden cevap            */
/* IDKullanici ve IDSirket her zaman session'dan gelir.                */
/* ------------------------------------------------------------------ */

const queryTypes = {
  /* ---------------- Okuma ---------------- */

  // IDCrmKisi boş → şirketin tüm teklifleri. Durum boş → hepsi.
  // SadeceGuncel varsayılan true: revize edilmiş eski sürümler gizlenir.
  SELECT_LIST: {
    zorunlu: [],
    dogrula: (p) => {
      if (!bos(p.Durum) && !DURUMLAR.includes(Number(p.Durum))) {
        throw new GecersizIstek("Geçersiz durum.");
      }
    },
    query: (p) =>
      exec("CrmTeklif_SELECT", {
        IDSirket: sqlInt(p.IDSirket),
        IDCrmKisi: sqlInt(p.IDCrmKisi ?? 0),
        Durum: sqlInt(p.Durum),
        SadeceGuncel: opt(p, "SadeceGuncel", sqlBitN),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Başlık + kalemler: { ...teklif, Kalemler: [...] }
  SELECT_BY_ID: {
    zorunlu: ["IDCrmTeklif"],
    query: (p) =>
      exec("CrmTeklif_SELECT_ByID", {
        IDCrmTeklif: sqlInt(p.IDCrmTeklif),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: (rs) => {
      const teklif = ilk(rs);
      return teklif ? { ...teklif, Kalemler: rs[1] ?? [] } : null;
    },
  },

  // Bir teklifin tüm sürümleri (en yeni üstte).
  SELECT_REVIZYON: {
    zorunlu: ["TeklifNo"],
    query: (p) =>
      exec("CrmTeklif_SELECT_Revizyonlar", {
        IDSirket: sqlInt(p.IDSirket),
        TeklifNo: sqlStr(p.TeklifNo),
      }),
    map: (rs) => rs[0] ?? [],
  },

  /* ---------------- Kayıt ---------------- */

  // Yeni taslak. Numara SP'de verilir.
  INSERT: {
    zorunlu: ["IDCrmKisi", "Konu", "TeklifTarihi", "Kalemler"],
    dogrula: teklifDogrula,
    query: (p) =>
      exec("CrmTeklif_INSERT", {
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        ...teklifAlanlari(p),
      }),
    map: (rs) => ({
      IDCrmTeklif: ilk(rs)?.IDCrmTeklif ?? null,
      TeklifNo: ilk(rs)?.TeklifNo ?? null,
    }),
  },

  // Sadece taslak. Formdaki tüm alanlar + kalemlerin tamamı gönderilmeli
  // (kalemler yeniden yazılır).
  UPDATE: {
    zorunlu: ["IDCrmTeklif", "IDCrmKisi", "Konu", "TeklifTarihi", "Kalemler"],
    dogrula: teklifDogrula,
    query: (p) =>
      exec("CrmTeklif_UPDATE_ByID", {
        IDCrmTeklif: sqlInt(p.IDCrmTeklif),
        IDSirket: sqlInt(p.IDSirket),
        ...teklifAlanlari(p),
      }),
    map: () => ({ success: true }),
  },

  /* ---------------- Durum akışı ---------------- */

  // Taslak → Gönderildi (kişiye aktivite kaydı düşer).
  UPDATE_GONDER: idIle("CrmTeklif_UPDATE_Gonder", true),

  // Gönderildi → Kabul. MusteriyeDonustur varsayılan true: kişi Kontak ise müşteri olur.
  UPDATE_KABUL: {
    zorunlu: ["IDCrmTeklif"],
    query: (p) =>
      exec("CrmTeklif_UPDATE_Kabul", {
        IDCrmTeklif: sqlInt(p.IDCrmTeklif),
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        MusteriyeDonustur: opt(p, "MusteriyeDonustur", sqlBitN),
      }),
    map: () => ({ success: true }),
  },

  // Gönderildi → Red.
  UPDATE_RED: {
    zorunlu: ["IDCrmTeklif"],
    dogrula: (p) => {
      if (!bos(p.RedNedeni) && String(p.RedNedeni).length > 500) {
        throw new GecersizIstek("Red nedeni en fazla 500 karakter olabilir.");
      }
    },
    query: (p) =>
      exec("CrmTeklif_UPDATE_Red", {
        IDCrmTeklif: sqlInt(p.IDCrmTeklif),
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        RedNedeni: sqlNStr(p.RedNedeni),
      }),
    map: () => ({ success: true }),
  },

  // Taslak / Gönderildi → İptal.
  UPDATE_IPTAL: idIle("CrmTeklif_UPDATE_Iptal"),

  // İptal → önceki durum (gönderilmemişse Taslak, gönderilmişse Gönderildi).
  UPDATE_IPTAL_GERI_AL: idIle("CrmTeklif_UPDATE_IptalGeriAl"),

  // Gönderildi / Red → yeni taslak sürüm. Döner: yeni IDCrmTeklif.
  INSERT_REVIZYON: {
    ...idIle("CrmTeklif_INSERT_Revizyon", true),
    map: (rs) => ({ IDCrmTeklif: ilk(rs)?.IDCrmTeklif ?? null }),
  },

  // Sadece taslak. Revizyonsa önceki sürüm geri açılır.
  DELETE: idIle("CrmTeklif_DELETE_ByID"),
};

// SQL Server kısıt ihlalleri (CHECK / FK: 547, UNIQUE: 2627 / 2601) → 400.
const KISIT_HATA = [547, 2601, 2627];

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

    if (KISIT_HATA.includes(err?.number)) {
      console.error("API Kısıt Hatası (teklif):", err.message);
      return fail(
        session.isMobile,
        "Gönderilen değerler geçersiz. Lütfen alanları kontrol edin.",
        400,
        "VALIDATION_ERROR",
      );
    }

    console.error("API Error (teklif):", err);

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
