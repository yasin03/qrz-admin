// SP çağrısı için SQL değer yardımcıları (ajanda, crm, teklif route'ları).
//
// Sorgu metin olarak kurulduğu için her değer buradan geçmeli:
// - Tırnak kaçırılır (Ali'nin → Ali''nin): sözdizimi hatası / SQL injection olmaz.
// - Boş değer (undefined, null, "") SQL NULL olarak gider; 'undefined' metni gitmez.
// - Sayı / tarih biçimi SQL'e gitmeden kontrol edilir; hatalıysa GecersizIstek (→ 400).

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
