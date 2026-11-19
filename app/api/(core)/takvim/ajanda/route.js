// Ajanda (etkinlik, tekrar, katılımcı, hatırlatma, kategori) API'si.
// SP'ler: /sql/ajanda.sql
import { NextResponse } from "next/server";
import { ExecuteQueryRecordsets } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api-session";

/* ------------------------------------------------------------------ */
/* SQL değer yardımcıları — boş değer NULL olarak gider                */
/* ------------------------------------------------------------------ */

const bos = (v) => v === undefined || v === null || v === "";

// nvarchar (serbest metin): N'' öneki unicode/emoji kaybolmasın diye.
function sqlNStr(v) {
  return bos(v) ? "NULL" : `N'${String(v).replace(/'/g, "''")}'`;
}

// varchar / char (renk, RRULE).
function sqlStr(v) {
  return bos(v) ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
}

function sqlInt(v) {
  if (bos(v)) return "NULL";
  const n = Number(v);
  if (!Number.isInteger(n)) throw new GecersizIstek(`Geçersiz sayı: ${v}`);
  return String(n);
}

function sqlBit(v) {
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

// Uygulama içi hatırlatma: istemci 5 dakikada bir sorar, bu yüzden önümüzdeki
// 5 dakikada zamanı gelecek hatırlatmalar da önceden döner; "zamanı geldi mi"
// kontrolünü istemci kendi saatiyle yapar (hooks/use-ajanda.ts ile aynı değer).
const HATIRLATMA_ILERI_DK = 5;
// İstemcinin geç kalma toleransı (lib/ajanda.ts HATIRLATMA_TOLERANS_DK = 15)
// + ileri bakış; @Simdi ileri kaydırıldığı için alt sınır da o kadar geniş.
const HATIRLATMA_TOLERANS_DK = 15 + HATIRLATMA_ILERI_DK;

// Şu an + dakika, TR yerel saati olarak 'yyyy-MM-dd HH:mm:ss' (sunucu saat
// diliminden bağımsız; Türkiye'de yaz saati yok).
function trSimdi(ekDakika = 0) {
  const d = new Date(Date.now() + (3 * 60 + ekDakika) * 60_000);
  return `'${d.toISOString().slice(0, 19).replace("T", " ")}'`;
}

// Katılımcı ID dizisi → '[12,34]'. undefined → NULL (katılımcılara dokunma).
function sqlIdListe(v) {
  if (v === undefined || v === null) return "NULL";
  if (!Array.isArray(v)) throw new GecersizIstek("Katılımcılar dizi olmalı.");
  const ids = v.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return `N'${JSON.stringify(ids)}'`;
}

class GecersizIstek extends Error {}

// EXEC [SP] @A = x, @B = y
function exec(sp, args) {
  const list = Object.entries(args).map(([k, v]) => `@${k} = ${v}`);
  return `EXEC [dbo].[${sp}] ${list.join(", ")}`;
}

// Ajanda_INSERT / Ajanda_UPDATE_ByID ortak alanları.
function ajandaAlanlari(p) {
  return {
    IDAjandaKategori: sqlInt(p.IDAjandaKategori),
    Baslik: sqlNStr(p.Baslik),
    Aciklama: sqlNStr(p.Aciklama),
    Konum: sqlNStr(p.Konum),
    Renk: sqlStr(p.Renk),
    TumGun: sqlBit(p.TumGun),
    Baslangic: sqlDate(p.Baslangic),
    Bitis: sqlDate(p.Bitis),
    TekrarKurali: sqlStr(p.TekrarKurali),
    TekrarBitis: sqlDate(p.TekrarBitis),
    Katilimcilar: sqlIdListe(p.Katilimcilar),
    HatirlatmaDakika: sqlInt(p.HatirlatmaDakika),
    HatirlatmaKanal: sqlInt(p.HatirlatmaKanal),
  };
}

const ilk = (rs, i = 0) => rs?.[i]?.[0] ?? null;
const ids = (rs, i) => (rs?.[i] ?? []).map((r) => r.IDKullanici);

/* ------------------------------------------------------------------ */
/* Sorgu tipleri: query → SQL, map → recordset'lerden cevap            */
/* IDKullanici her zaman session'dan gelir.                            */
/* ------------------------------------------------------------------ */

const queryTypes = {
  // Takvim aralığı (ham kayıtlar: tekil / seri / istisna).
  SELECT_AJANDA_LIST: {
    zorunlu: ["Baslangic", "Bitis"],
    query: (p) =>
      exec("Ajanda_SELECT_ByTarih", {
        IDKullanici: sqlInt(p.IDKullanici),
        Baslangic: sqlDate(p.Baslangic),
        Bitis: sqlDate(p.Bitis),
      }),
    map: (rs) => rs[0] ?? [],
  },

  SELECT_AJANDA: {
    zorunlu: ["IDAjanda"],
    query: (p) =>
      exec("Ajanda_SELECT", {
        IDAjanda: sqlInt(p.IDAjanda),
        IDKullanici: sqlInt(p.IDKullanici),
      }),
    map: (rs) => ({ kayit: ilk(rs), katilimcilar: rs[1] ?? [] }),
  },

  INSERT_AJANDA: {
    zorunlu: ["Baslik", "Baslangic"],
    query: (p) =>
      exec("Ajanda_INSERT", {
        IDKullanici: sqlInt(p.IDKullanici),
        ...ajandaAlanlari(p),
      }),
    map: (rs) => ({
      IDAjanda: ilk(rs)?.IDAjanda ?? null,
      yeniKatilimcilar: ids(rs, 1),
    }),
  },

  // Tekil kayıt veya serinin tamamı ("tümü").
  UPDATE_AJANDA: {
    zorunlu: ["IDAjanda", "Baslik", "Baslangic"],
    query: (p) =>
      exec("Ajanda_UPDATE_ByID", {
        IDAjanda: sqlInt(p.IDAjanda),
        IDKullanici: sqlInt(p.IDKullanici),
        ...ajandaAlanlari(p),
        IstisnalariSil: sqlBit(p.IstisnalariSil),
      }),
    map: (rs) => ({
      IDAjanda: ilk(rs)?.IDAjanda ?? null,
      ZamanDegisti: Boolean(ilk(rs)?.ZamanDegisti),
      yeniKatilimcilar: ids(rs, 1),
    }),
  },

  // "Sadece bu tekrar": düzenle veya Iptal = true ile sil.
  UPDATE_AJANDA_ISTISNA: {
    zorunlu: ["IDAjandaSeri", "OrijinalTarih"],
    query: (p) =>
      exec("Ajanda_UPDATE_Istisna", {
        IDAjandaSeri: sqlInt(p.IDAjandaSeri),
        OrijinalTarih: sqlDate(p.OrijinalTarih),
        IDKullanici: sqlInt(p.IDKullanici),
        Iptal: sqlBit(p.Iptal),
        Baslik: sqlNStr(p.Baslik),
        Aciklama: sqlNStr(p.Aciklama),
        Konum: sqlNStr(p.Konum),
        IDAjandaKategori: sqlInt(p.IDAjandaKategori),
        Renk: sqlStr(p.Renk),
        TumGun: sqlBit(p.TumGun),
        Baslangic: sqlDate(p.Baslangic),
        Bitis: sqlDate(p.Bitis),
      }),
    map: (rs) => ({
      IDAjanda: ilk(rs)?.IDAjanda ?? null,
      ZamanDegisti: Boolean(ilk(rs)?.ZamanDegisti),
    }),
  },

  // Kaydı (seriyse tüm tekrarlarıyla) siler.
  DELETE_AJANDA: {
    zorunlu: ["IDAjanda"],
    query: (p) =>
      exec("Ajanda_DELETE_ByID", {
        IDAjanda: sqlInt(p.IDAjanda),
        IDKullanici: sqlInt(p.IDKullanici),
      }),
    map: () => ({ success: true }),
  },

  // Katılımcı daveti yanıtla: 0 Bekliyor, 1 Kabul, 2 Ret.
  UPDATE_KATILIMCI_DURUM: {
    zorunlu: ["IDAjanda", "Durum"],
    query: (p) =>
      exec("AjandaKatilimci_UPDATE_Durum", {
        IDAjanda: sqlInt(p.IDAjanda),
        IDKullanici: sqlInt(p.IDKullanici),
        Durum: sqlInt(p.Durum),
      }),
    map: () => ({ success: true }),
  },

  // Kullanıcının kendi hatırlatma ayarı. Dakika boş → hatırlatma kapalı.
  UPDATE_KATILIMCI_HATIRLATMA: {
    zorunlu: ["IDAjanda"],
    query: (p) =>
      exec("AjandaKatilimci_UPDATE_Hatirlatma", {
        IDAjanda: sqlInt(p.IDAjanda),
        IDKullanici: sqlInt(p.IDKullanici),
        Dakika: sqlInt(p.Dakika),
        Kanal: sqlInt(p.Kanal),
      }),
    map: () => ({ success: true }),
  },

  // Uygulama içi bildirimler (oturumdaki kullanıcı, Kanal = 1).
  // Tekrarlı serilerin sıradaki tekrarı frontend'de RRULE ile hesaplanır.
  SELECT_HATIRLATMA: {
    zorunlu: [],
    query: (p) =>
      exec("Ajanda_SELECT_HatirlatmaAdaylari", {
        Simdi: trSimdi(HATIRLATMA_ILERI_DK),
        IDKullanici: sqlInt(p.IDKullanici),
        Kanal: "1",
        GecikmeToleransDk: String(HATIRLATMA_TOLERANS_DK),
      }),
    map: (rs) => ({ adaylar: rs[0] ?? [], istisnalar: rs[1] ?? [] }),
  },

  /* ---------------- Kategori ---------------- */

  SELECT_KATEGORI: {
    zorunlu: [],
    query: (p) =>
      exec("AjandaKategori_SELECT_ByIDKullanici", {
        IDKullanici: sqlInt(p.IDKullanici),
      }),
    map: (rs) => rs[0] ?? [],
  },

  INSERT_KATEGORI: {
    zorunlu: ["Ad", "Renk"],
    query: (p) =>
      exec("AjandaKategori_INSERT", {
        IDKullanici: sqlInt(p.IDKullanici),
        Ad: sqlNStr(p.Ad),
        Renk: sqlStr(p.Renk),
        Sira: sqlInt(p.Sira ?? 0),
      }),
    map: (rs) => ({ IDAjandaKategori: ilk(rs)?.IDAjandaKategori ?? null }),
  },

  UPDATE_KATEGORI: {
    zorunlu: ["IDAjandaKategori", "Ad", "Renk"],
    query: (p) =>
      exec("AjandaKategori_UPDATE_ByID", {
        IDAjandaKategori: sqlInt(p.IDAjandaKategori),
        IDKullanici: sqlInt(p.IDKullanici),
        Ad: sqlNStr(p.Ad),
        Renk: sqlStr(p.Renk),
        Sira: sqlInt(p.Sira ?? 0),
      }),
    map: () => ({ success: true }),
  },

  DELETE_KATEGORI: {
    zorunlu: ["IDAjandaKategori"],
    query: (p) =>
      exec("AjandaKategori_DELETE_ByID", {
        IDAjandaKategori: sqlInt(p.IDAjandaKategori),
        IDKullanici: sqlInt(p.IDKullanici),
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

    // IDKullanici client'tan değil, her zaman oturumdan.
    const params = {
      ...(payload.params ?? {}),
      IDKullanici: session.user.IDKullanici,
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

    console.error("API Error (ajanda):", err);

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
