// SP çağrısı için SQL değer yardımcıları (ajanda, crm, teklif, satış, finans route'ları).
//
// Sorgu metin olarak kurulduğu için her değer buradan geçmeli:
// - Tırnak kaçırılır (Ali'nin → Ali''nin): sözdizimi hatası / SQL injection olmaz.
// - Boş değer (undefined, null, "") SQL NULL olarak gider; 'undefined' metni gitmez.
// - Sayı / tarih biçimi SQL'e gitmeden kontrol edilir; hatalıysa GecersizIstek (→ 400).

import { PARA_BIRIMI_KODLARI } from "@/constants/data";

/** Değer boş mu (undefined, null, ""). */
export const bos = (v) => v === undefined || v === null || v === "";

/** Kullanıcı kaynaklı hatalı istek; route'ta 400 VALIDATION_ERROR döner. */
export class GecersizIstek extends Error {}

/** Serbest metin (nvarchar). N'' öneki Türkçe karakter / unicode / emoji kaybolmasın diye. */
export function sqlNStr(v) {
  return bos(v) ? "NULL" : `N'${String(v).replace(/'/g, "''")}'`;
}

/** Kod değerleri (varchar / char: renk, para birimi, il kodu ...). */
export function sqlStr(v) {
  return bos(v) ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
}

/** Tam sayı (ID, adet, dakika). */
export function sqlInt(v) {
  if (bos(v)) return "NULL";
  const n = Number(v);
  if (!Number.isInteger(n)) throw new GecersizIstek(`Geçersiz sayı: ${v}`);
  return String(n);
}

/** Ondalıklı sayı (tutar, oran, kur). */
export function sqlDec(v) {
  if (bos(v)) return "NULL";
  const n = Number(v);
  if (!Number.isFinite(n)) throw new GecersizIstek(`Geçersiz sayı: ${v}`);
  return String(n);
}

const dogruMu = (v) => v === true || v === 1 || v === "1" || v === "true";

/** bit — boş değer 0. */
export function sqlBit(v) {
  return dogruMu(v) ? "1" : "0";
}

/** bit — boş değer NULL (SP mevcut değeri korur / varsayılanı kullanır). */
export function sqlBitN(v) {
  if (bos(v)) return "NULL";
  return dogruMu(v) ? "1" : "0";
}

// Tarihler TR yerel saatidir. "2026-11-20T14:00:00.000Z" gelse de Z yok
// sayılır (lib/format.ts ile aynı konvansiyon).
const TARIH = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(:\d{2})?(?:\.\d+)?)?Z?$/;

/** Tarih + saat (datetime2) → 'yyyy-MM-dd HH:mm:ss'. */
export function sqlDate(v) {
  if (bos(v)) return "NULL";
  const m = String(v).match(TARIH);
  if (!m) throw new GecersizIstek(`Geçersiz tarih: ${v}`);
  return `'${m[1]} ${m[2] ?? "00:00"}${m[3] ?? ":00"}'`;
}

const GUN = /^(\d{4}-\d{2}-\d{2})(?:[T ].*)?$/;

/** Değerin gün kısmı ('yyyy-MM-dd'), boşsa null. Karşılaştırma için de kullanılır. */
export function gunAl(v) {
  if (bos(v)) return null;
  const m = String(v).match(GUN);
  if (!m) throw new GecersizIstek(`Geçersiz tarih: ${v}`);
  return m[1];
}

/** Sadece gün (date kolonları) → 'yyyy-MM-dd'. Saat kısmı atılır. */
export function sqlGun(v) {
  const g = gunAl(v);
  return g ? `'${g}'` : "NULL";
}

/**
 * EXEC [dbo].[SP] @A = x, @B = y — parametreler isimle gider.
 * undefined değerler gönderilmez (SP varsayılanı devreye girer).
 */
export function exec(sp, args) {
  const list = Object.entries(args)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `@${k} = ${v}`);
  return `EXEC [dbo].[${sp}] ${list.join(", ")}`;
}

/** Alan hiç gönderilmediyse undefined döner → exec parametreyi atlar. */
export const opt = (p, key, fn) => (p[key] === undefined ? undefined : fn(p[key]));

/** i. result set'in ilk satırı (yoksa null). */
export const ilk = (rs, i = 0) => rs?.[i]?.[0] ?? null;

/** SP içindeki THROW kodları → [HTTP durumu, hata kodu]. */
export const SP_HATA = {
  50001: [403, "FORBIDDEN"],
  50002: [404, "NOT_FOUND"],
  50003: [400, "VALIDATION_ERROR"],
};

/* ------------------------------------------------------------------ */
/* Ortak doğrulamalar (sayı, para birimi) ve kalemli belgeler          */
/* (teklif, satış). Tutarlar FE'de hesaplanır (teklifHesapla); burada  */
/* sadece biçim / aralık kontrolü yapılır.                             */
/* Not: teklif/route.js bunların kendi kopyasını taşıyor; o route'a    */
/* dokunulduğunda buradakilere geçirilebilir.                          */
/* ------------------------------------------------------------------ */


/** Sayı kontrolü. Boşsa zorunlu değilse null döner. */
export function sayi(v, alan, { min, max, zorunlu = true, sifirHaric = false } = {}) {
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

/** 0–100 arası oran; boşsa 0. */
export const oran = (v, alan) => sayi(v, alan, { min: 0, max: 100, zorunlu: false }) ?? 0;

/** Para birimi kodu (boşsa TRY). Geçersizse GecersizIstek. */
export function paraBirimiAl(v) {
  const pb = bos(v) ? "TRY" : String(v).toUpperCase();
  if (!PARA_BIRIMI_KODLARI.includes(pb)) {
    throw new GecersizIstek(`Para birimi ${PARA_BIRIMI_KODLARI.join(", ")} olmalı.`);
  }
  return pb;
}

/**
 * Kalemleri doğrular ve SP'nin beklediği JSON'a çevirir (Crm*Kalem_INSERT).
 * Sadece bilinen alanlar geçer; sayılar Number olarak yazılır (OPENJSON decimal okur).
 * @param belge Hata mesajında geçen belge adı ("Teklifte", "Satışta").
 */
export function kalemlerJson(kalemler, belge = "Belgede") {
  if (!Array.isArray(kalemler) || kalemler.length === 0) {
    throw new GecersizIstek(`${belge} en az bir kalem olmalı.`);
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

/** Başlık toplamlarının biçim kontrolü (teklif / satış ortak). */
export function toplamlarDogrula(p) {
  oran(p.GenelIskontoOrani, "Genel iskonto oranı");
  sayi(p.AraToplam, "Ara toplam");
  sayi(p.KdvToplam, "KDV toplamı");
  sayi(p.GenelToplam, "Genel toplam");
}
