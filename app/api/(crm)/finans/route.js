// CRM finans API'si (tahsilat / iade, alacaklar, müşteri bakiyeleri, özet).
// SP'ler: /sql/crm_finans.sql
//
// Finans satışın parasını tutar; satış (/api/satis) finansı bilmez.
// Kalan / ödeme durumu saklanmaz, view'lerde hesaplanır:
//   Kalan = Satış toplamı (iptalse 0) − Σ Tahsilat + Σ İade
// Tutar kuralları (kalanı / tahsil edileni aşmama) SP'de, kilitli okumayla
// kontrol edilir; burada sadece biçim / aralık kontrolü yapılır.
//
// Tip         : 1 Tahsilat, 2 İade
// OdemeSekli  : 1 Havale/EFT, 2 Kredi kartı, 3 Nakit, 4 Çek, 5 Diğer
// OdemeDurumu : 0 Ödenmedi, 1 Kısmi, 2 Ödendi, 3 İade bekliyor
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
  opt,
  paraBirimiAl,
  sayi,
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

const TIPLER = [1, 2];
const ODEME_SEKILLERI = [1, 2, 3, 4, 5];
const ODEME_DURUMLARI = [0, 1, 2, 3];

function listedenMi(v, liste, mesaj) {
  if (!bos(v) && !liste.includes(Number(v))) throw new GecersizIstek(mesaj);
}

const metinUzunluk = (v, alan, max) => {
  if (!bos(v) && String(v).length > max) {
    throw new GecersizIstek(`${alan} en fazla ${max} karakter olabilir.`);
  }
};

// INSERT_TAHSILAT / UPDATE_TAHSILAT ortak kontrolleri.
function tahsilatDogrula(p) {
  listedenMi(p.Tip, TIPLER, "Geçersiz kayıt tipi.");
  listedenMi(p.OdemeSekli, ODEME_SEKILLERI, "Geçersiz ödeme şekli.");
  gunAl(p.Tarih);
  gunAl(p.FaturaTarihi);
  sayi(p.Tutar, "Tutar", { min: 0, sifirHaric: true });
  sayi(p.Kur, "Kur", { min: 0, sifirHaric: true, zorunlu: false });
  if (!bos(p.ParaBirimi)) paraBirimiAl(p.ParaBirimi);
  metinUzunluk(p.FaturaNo, "Fatura no", 50);
  metinUzunluk(p.Aciklama, "Açıklama", 500);
}

// CrmTahsilat_INSERT / CrmTahsilat_UPDATE_ByID ortak alanları.
// Kur boşsa gönderilmez: INSERT'te satışın kuru, UPDATE'te mevcut kur kullanılır.
const tahsilatAlanlari = (p) => ({
  Tip: bos(p.Tip) ? undefined : sqlInt(p.Tip),
  Tarih: sqlGun(p.Tarih),
  Tutar: sqlDec(p.Tutar),
  Kur: bos(p.Kur) ? undefined : sqlDec(p.Kur),
  OdemeSekli: bos(p.OdemeSekli) ? undefined : sqlInt(p.OdemeSekli),
  FaturaNo: sqlNStr(p.FaturaNo),
  FaturaTarihi: sqlGun(p.FaturaTarihi),
  Aciklama: sqlNStr(p.Aciklama),
});

/* ------------------------------------------------------------------ */
/* Sorgu tipleri: query → SQL, map → recordset'lerden cevap            */
/* IDKullanici ve IDSirket her zaman session'dan gelir.                */
/* ------------------------------------------------------------------ */

const queryTypes = {
  /* ---------------- Satışlar sekmesi ---------------- */

  // Ödeme rozeti için: satış başına net tahsil edilen. Sadece CrmTahsilat okunur.
  // Tahsilatı olmayan satış listede yoktur (FE: TahsilEdilen = 0).
  SELECT_SATIS_TAHSILAT: {
    zorunlu: [],
    query: (p) =>
      exec("CrmFinans_SELECT_SatisTahsilat", {
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: (rs) => rs[0] ?? [],
  },

  /* ---------------- Finans sekmesi ---------------- */

  // Alacaklar. SadeceAcik varsayılan true: kalanı olan + iade bekleyen satışlar.
  SELECT_ALACAK: {
    zorunlu: [],
    dogrula: (p) => listedenMi(p.OdemeDurumu, ODEME_DURUMLARI, "Geçersiz ödeme durumu."),
    query: (p) =>
      exec("CrmFinans_SELECT_Alacak", {
        IDSirket: sqlInt(p.IDSirket),
        IDCrmKisi: sqlInt(p.IDCrmKisi ?? 0),
        OdemeDurumu: sqlInt(p.OdemeDurumu),
        SadeceAcik: opt(p, "SadeceAcik", sqlBitN),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Müşteri bakiyeleri (TL). SadeceBakiyeli → bakiyesi 0 olmayanlar.
  SELECT_CARI: {
    zorunlu: [],
    query: (p) =>
      exec("CrmFinans_SELECT_Cari", {
        IDSirket: sqlInt(p.IDSirket),
        SadeceBakiyeli: opt(p, "SadeceBakiyeli", sqlBitN),
      }),
    map: (rs) => rs[0] ?? [],
  },

  // Özet kartlar (tek satır → nesne).
  SELECT_OZET: {
    zorunlu: [],
    query: (p) =>
      exec("CrmFinans_SELECT_Ozet", {
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: (rs) => ilk(rs),
  },

  /* ---------------- Tahsilat ---------------- */

  // IDCrmSatis / IDCrmKisi boş → hepsi. Baslangic / Bitis dahil. Tip boş → hepsi.
  SELECT_TAHSILAT_LIST: {
    zorunlu: [],
    dogrula: (p) => {
      listedenMi(p.Tip, TIPLER, "Geçersiz kayıt tipi.");
      const bas = gunAl(p.Baslangic);
      const bit = gunAl(p.Bitis);
      if (bas && bit && bit < bas) {
        throw new GecersizIstek("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      }
    },
    query: (p) =>
      exec("CrmTahsilat_SELECT", {
        IDSirket: sqlInt(p.IDSirket),
        IDCrmSatis: sqlInt(p.IDCrmSatis ?? 0),
        IDCrmKisi: sqlInt(p.IDCrmKisi ?? 0),
        Baslangic: sqlGun(p.Baslangic),
        Bitis: sqlGun(p.Bitis),
        Tip: sqlInt(p.Tip),
      }),
    map: (rs) => rs[0] ?? [],
  },

  SELECT_TAHSILAT_BY_ID: {
    zorunlu: ["IDCrmTahsilat"],
    query: (p) =>
      exec("CrmTahsilat_SELECT_ByID", {
        IDCrmTahsilat: sqlInt(p.IDCrmTahsilat),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: (rs) => ilk(rs),
  },

  // Yeni tahsilat / iade. Para birimi boşsa satışınki; kişi satıştan alınır.
  INSERT_TAHSILAT: {
    zorunlu: ["IDCrmSatis", "Tarih", "Tutar"],
    dogrula: tahsilatDogrula,
    query: (p) =>
      exec("CrmTahsilat_INSERT", {
        IDSirket: sqlInt(p.IDSirket),
        IDKullanici: sqlInt(p.IDKullanici),
        IDCrmSatis: sqlInt(p.IDCrmSatis),
        ParaBirimi: bos(p.ParaBirimi) ? undefined : sqlStr(paraBirimiAl(p.ParaBirimi)),
        ...tahsilatAlanlari(p),
      }),
    map: (rs) => ({ IDCrmTahsilat: ilk(rs)?.IDCrmTahsilat ?? null }),
  },

  // Düzeltme. Satış ve para birimi değişmez.
  UPDATE_TAHSILAT: {
    zorunlu: ["IDCrmTahsilat", "Tarih", "Tutar"],
    dogrula: tahsilatDogrula,
    query: (p) =>
      exec("CrmTahsilat_UPDATE_ByID", {
        IDCrmTahsilat: sqlInt(p.IDCrmTahsilat),
        IDSirket: sqlInt(p.IDSirket),
        ...tahsilatAlanlari(p),
      }),
    map: () => ({ success: true }),
  },

  // Yanlış girilen kaydı siler.
  DELETE_TAHSILAT: {
    zorunlu: ["IDCrmTahsilat"],
    query: (p) =>
      exec("CrmTahsilat_DELETE_ByID", {
        IDCrmTahsilat: sqlInt(p.IDCrmTahsilat),
        IDSirket: sqlInt(p.IDSirket),
      }),
    map: () => ({ success: true }),
  },
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
      console.error("API Kısıt Hatası (finans):", err.message);
      return fail(
        session.isMobile,
        "Gönderilen değerler geçersiz. Lütfen alanları kontrol edin.",
        400,
        "VALIDATION_ERROR",
      );
    }

    console.error("API Error (finans):", err);

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
