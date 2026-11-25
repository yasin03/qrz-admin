// CRM satış API'si (başlık + kalemler, iptal, abonelik yenileme).
// SP'ler: /sql/crm_satis.sql
// Tutarlar FE'de hesaplanır (modules/crm/lib/teklif.ts → teklifHesapla) ve
// burada sadece biçim / aralık kontrolünden geçip olduğu gibi yazılır.
//
// Satış para hareketi tutmaz: tahsilat / kalan / ödeme durumu /api/finans'tadır.
//
// Durum     : 0 Geçerli, 1 İptal
// SatisTipi : 1 Tek seferlik, 2 Aylık abonelik, 3 Yıllık abonelik
import { NextResponse } from "next/server";
import { ExecuteQueryRecordsets } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";
import {
  GecersizIstek,
  SP_HATA,
  bos,
  exec,
  gunAl,
  ilk,
  kalemlerJson,
  paraBirimiAl,
  sayi,
  sqlDec,
  sqlGun,
  sqlInt,
  sqlNStr,
  sqlStr,
  toplamlarDogrula,
} from "@/lib/sql";

/* ------------------------------------------------------------------ */
/* Doğrulama                                                           */
/* ------------------------------------------------------------------ */

const DURUMLAR = [0, 1];
const SATIS_TIPLERI = [1, 2, 3];

const abonelikMi = (tip) => Number(tip) === 2 || Number(tip) === 3;

// INSERT / UPDATE ortak kontrolleri.
function satisDogrula(p) {
  const konu = String(p.Konu ?? "").trim();
  if (!konu) throw new GecersizIstek("Konu zorunlu.");
  if (konu.length > 250) throw new GecersizIstek("Konu en fazla 250 karakter olabilir.");

  const tip = bos(p.SatisTipi) ? 1 : Number(p.SatisTipi);
  if (!SATIS_TIPLERI.includes(tip)) throw new GecersizIstek("Geçersiz satış tipi.");

  gunAl(p.SatisTarihi);

  if (abonelikMi(tip)) {
    const bas = gunAl(p.BaslangicTarihi);
    const bit = gunAl(p.BitisTarihi);
    if (!bas || !bit) {
      throw new GecersizIstek("Abonelik satışında başlangıç ve bitiş tarihi zorunlu.");
    }
    if (bit < bas) throw new GecersizIstek("Bitiş tarihi başlangıç tarihinden önce olamaz.");
  }

  const paraBirimi = paraBirimiAl(p.ParaBirimi);
  if (paraBirimi !== "TRY") sayi(p.Kur, "Kur", { min: 0, sifirHaric: true });

  toplamlarDogrula(p);
}

// CrmSatis_INSERT / CrmSatis_UPDATE_ByID ortak alanları.
// Kişi ve kaynak teklif burada yok: sadece INSERT'te gönderilir, sonra değişmez.
function satisAlanlari(p) {
  const tip = bos(p.SatisTipi) ? 1 : Number(p.SatisTipi);
  const paraBirimi = paraBirimiAl(p.ParaBirimi);
  return {
    SatisTipi: sqlInt(tip),
    SatisTarihi: sqlGun(p.SatisTarihi),
    // Tek seferlikte dönem yok (SP de NULL yazar).
    BaslangicTarihi: abonelikMi(tip) ? sqlGun(p.BaslangicTarihi) : "NULL",
    BitisTarihi: abonelikMi(tip) ? sqlGun(p.BitisTarihi) : "NULL",
    Konu: sqlNStr(String(p.Konu).trim()),
    Aciklama: sqlNStr(p.Aciklama),
    ParaBirimi: sqlStr(paraBirimi),
    Kur: paraBirimi === "TRY" ? "1" : sqlDec(p.Kur),
    GenelIskontoOrani: sqlDec(p.GenelIskontoOrani ?? 0),
    AraToplam: sqlDec(p.AraToplam),
    GenelIskontoTutari: sqlDec(p.GenelIskontoTutari ?? 0),
    IskontoToplam: sqlDec(p.IskontoToplam ?? 0),
    KdvToplam: sqlDec(p.KdvToplam),
    GenelToplam: sqlDec(p.GenelToplam),
    Kalemler: kalemlerJson(p.Kalemler, "Satışta"),
  };
}

const metinUzunluk = (v, alan, max) => {
  if (!bos(v) && String(v).length > max) {
    throw new GecersizIstek(`${alan} en fazla ${max} karakter olabilir.`);
  }
};

/* ------------------------------------------------------------------ */
/* Sorgu tipleri: query → SQL, map → recordset'lerden cevap            */
/* IDKullanici ve IDSirket her zaman session'dan gelir.                */
/* kisitMesaji: { [SQL hata no]: mesaj } — kısıt hatasında (547 FK /    */
/* CHECK, 2601 / 2627 UNIQUE) gösterilecek özel mesaj; yoksa genel.    */
/* ------------------------------------------------------------------ */

const queryTypes = {
  /* ---------------- Okuma ---------------- */

  // IDCrmKisi boş → şirketin tüm satışları. Durum / SatisTipi boş → hepsi.
  SELECT_LIST: {
    zorunlu: [],
    dogrula: (p) => {
      if (!bos(p.Durum) && !DURUMLAR.includes(Number(p.Durum))) {
        throw new GecersizIstek("Geçersiz durum.");
      }
      if (!bos(p.SatisTipi) && !SATIS_TIPLERI.includes(Number(p.SatisTipi))) {
        throw new GecersizIstek("Geçersiz satış tipi.");
      }
    },
    query: (p) =>
      exec("CrmSatis_SELECT", {
        IDSirket: sqlInt(p.IDSirket),
        IDCrmKisi: sqlInt(p.IDCrmKisi ?? 0),
        Durum: sqlInt(p.Durum),
        SatisTipi: sqlInt(p.SatisTipi),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Başlık + kalemler: { ...satis, Kalemler: [...] }
  SELECT_BY_ID: {
    zorunlu: ["IDCrmSatis"],
    query: (p) =>
      exec("CrmSatis_SELECT_ByID", {
        IDCrmSatis: sqlInt(p.IDCrmSatis),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: (rs) => {
      const satis = ilk(rs);
      return satis ? { ...satis, Kalemler: rs[1] ?? [] } : null;
    },
  },

  // Bitişi Gun (varsayılan 30) gün içinde olan / geçmiş, yenilenmemiş abonelikler.
  SELECT_YENILEME: {
    zorunlu: [],
    dogrula: (p) => {
      sayi(p.Gun, "Gün", { min: 0, max: 3650, zorunlu: false });
    },
    query: (p) =>
      exec("CrmSatis_SELECT_Yenileme", {
        IDSirket: sqlInt(p.IDSirket),
        Gun: bos(p.Gun) ? undefined : sqlInt(p.Gun),
      }),
    map: (rs) => rs[0] ?? [],
  },

  /* ---------------- Kayıt ---------------- */

  // Yeni satış. IDCrmTeklif verilirse kabul edilmiş tekliften dönüşüm.
  // Numara SP'de verilir; kişi Kontak ise müşteri olur.
  INSERT: {
    zorunlu: ["IDCrmKisi", "Konu", "SatisTarihi", "Kalemler"],
    dogrula: satisDogrula,
    query: (p) =>
      exec("CrmSatis_INSERT", {
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        IDCrmKisi: sqlInt(p.IDCrmKisi),
        IDCrmTeklif: sqlInt(p.IDCrmTeklif),
        ...satisAlanlari(p),
      }),
    map: (rs) => ({
      IDCrmSatis: ilk(rs)?.IDCrmSatis ?? null,
      SatisNo: ilk(rs)?.SatisNo ?? null,
    }),
    // UQ_CrmSatis_Teklif: aynı teklif eşzamanlı iki kez dönüştürülürse.
    kisitMesaji: { 2601: "Bu teklif zaten satışa dönüştürülmüş." },
  },

  // Sadece geçerli satış. Formdaki tüm alanlar + kalemlerin tamamı gönderilmeli
  // (kalemler yeniden yazılır). Kişi ve kaynak teklif değişmez.
  UPDATE: {
    zorunlu: ["IDCrmSatis", "Konu", "SatisTarihi", "Kalemler"],
    dogrula: satisDogrula,
    query: (p) =>
      exec("CrmSatis_UPDATE_ByID", {
        IDCrmSatis: sqlInt(p.IDCrmSatis),
        IDSirket: sqlInt(p.IDSirket),
        ...satisAlanlari(p),
      }),
    map: () => ({ success: true }),
  },

  /* ---------------- Durum / yenileme ---------------- */

  // Geçerli → İptal. Teklif bağı çözülür; tahsilatlar finans tarafında kalır.
  UPDATE_IPTAL: {
    zorunlu: ["IDCrmSatis"],
    dogrula: (p) => metinUzunluk(p.IptalNedeni, "İptal nedeni", 500),
    query: (p) =>
      exec("CrmSatis_UPDATE_Iptal", {
        IDCrmSatis: sqlInt(p.IDCrmSatis),
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        IptalNedeni: sqlNStr(p.IptalNedeni),
      }),
    map: () => ({ success: true }),
  },

  // Abonelik → bir sonraki dönem için yeni satış. SatisTarihi boşsa bugün.
  INSERT_YENILEME: {
    zorunlu: ["IDCrmSatis"],
    dogrula: (p) => gunAl(p.SatisTarihi),
    query: (p) =>
      exec("CrmSatis_INSERT_Yenileme", {
        IDCrmSatis: sqlInt(p.IDCrmSatis),
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        SatisTarihi: bos(p.SatisTarihi) ? undefined : sqlGun(p.SatisTarihi),
      }),
    map: (rs) => ({
      IDCrmSatis: ilk(rs)?.IDCrmSatis ?? null,
      SatisNo: ilk(rs)?.SatisNo ?? null,
    }),
    // UQ_CrmSatis_Onceki: aynı satış eşzamanlı iki kez yenilenirse.
    kisitMesaji: { 2601: "Bu satış zaten yenilenmiş." },
  },

  // Yanlış girilen kaydı siler. Tahsilatı varsa FK_CrmTahsilat_CrmSatis engeller.
  DELETE: {
    zorunlu: ["IDCrmSatis"],
    query: (p) =>
      exec("CrmSatis_DELETE_ByID", {
        IDCrmSatis: sqlInt(p.IDCrmSatis),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: () => ({ success: true }),
    // FK_CrmTahsilat_CrmSatis (NO ACTION)
    kisitMesaji: { 547: "Tahsilatı olan satış silinemez. Satışı iptal edin." },
  },
};

// SQL Server kısıt ihlalleri (CHECK / FK: 547, UNIQUE: 2627 / 2601) → 400.
const KISIT_HATA = [547, 2601, 2627];

export const POST = withSession(async (request, session) => {
  let tanim;
  try {
    const payload = await request.json();
    const { type } = payload;
    tanim = queryTypes[type];

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
      console.error("API Kısıt Hatası (satis):", err.message);
      return fail(
        session.isMobile,
        tanim?.kisitMesaji?.[err.number] ??
          "Gönderilen değerler geçersiz. Lütfen alanları kontrol edin.",
        400,
        "VALIDATION_ERROR",
      );
    }

    console.error("API Error (satis):", err);

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
