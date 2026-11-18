import { RRule } from "rrule";
import {
  addMilliseconds,
  eachDayOfInterval,
  endOfDay,
  format,
  isValid,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
} from "date-fns";

import type {
  AjandaDetayResponse,
  AjandaHatirlatma,
  AjandaHatirlatmaResponse,
  AjandaKayitRow,
  AjandaOlay,
} from "@/modules/core/types/takvim";

/* ------------------------------------------------------------------ */
/* Tarih dönüşümleri                                                   */
/* DB'deki tarihler TR yerel saatidir; API "…Z" ile döndürse de Z yok   */
/* sayılır (lib/format.ts ile aynı konvansiyon).                        */
/* ------------------------------------------------------------------ */

/** API tarihi → yerel Date ("2026-11-20T14:00:00.000Z" → 20 Kas 14:00). */
export function parseYerel(value: string): Date;
export function parseYerel(value: string | null | undefined): Date | null;
export function parseYerel(value: string | null | undefined) {
  if (!value) return null;
  const d = parseISO(String(value).replace(/Z$/, ""));
  return isValid(d) ? d : null;
}

/** Yerel Date → API'ye gönderilecek "yyyy-MM-ddTHH:mm:ss". */
export function formatYerel(date: Date): string;
export function formatYerel(date: Date | null | undefined): string | null;
export function formatYerel(date: Date | null | undefined) {
  return date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : null;
}

/*
 * rrule "floating time": yerel duvar saati UTC alanlarına yazılır, kural
 * UTC'de açılır, sonuç tekrar yerel duvar saatine çevrilir. Böylece
 * tarayıcının saat dilimi / yaz saati sonucu kaydırmaz.
 */
const toFloating = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()),
  );

const fromFloating = (u: Date) =>
  new Date(
    u.getUTCFullYear(),
    u.getUTCMonth(),
    u.getUTCDate(),
    u.getUTCHours(),
    u.getUTCMinutes(),
    u.getUTCSeconds(),
  );

function kural(tekrarKurali: string, baslangic: Date) {
  const options = RRule.parseString(tekrarKurali.replace(/^RRULE:/i, ""));
  return new RRule({ ...options, dtstart: toFloating(baslangic) });
}

/** Serinin [aralikBas, aralikSon] arasındaki tekrar başlangıçları. */
export function tekrarlar(
  tekrarKurali: string,
  baslangic: Date,
  aralikBas: Date,
  aralikSon: Date,
): Date[] {
  return kural(tekrarKurali, baslangic)
    .between(toFloating(aralikBas), toFloating(aralikSon), true)
    .map(fromFloating);
}

/** Serinin ilk ve son tekrarı arasındaki sıradaki tekrar (>= tarih). */
export function sonrakiTekrar(tekrarKurali: string, baslangic: Date, tarih: Date) {
  const d = kural(tekrarKurali, baslangic).after(toFloating(tarih), true);
  return d ? fromFloating(d) : null;
}

/**
 * Kuralın son tekrarı (UNTIL veya COUNT varsa), yoksa null (sonsuz seri).
 * Kaydederken TekrarBitis kolonuna yazılır.
 */
export function tekrarBitisHesapla(tekrarKurali: string, baslangic: Date): Date | null {
  const r = kural(tekrarKurali, baslangic);
  if (!r.options.until && !r.options.count) return null;
  const hepsi = r.all();
  return hepsi.length ? fromFloating(hepsi[hepsi.length - 1]) : null;
}

/* ------------------------------------------------------------------ */
/* Ham kayıtları takvim olaylarına açma                                */
/* ------------------------------------------------------------------ */

const id = (v: unknown) => (v === null || v === undefined ? null : String(v));

/** Serinin bir tekrarını istisnayla eşleştirmek için anahtar. */
const tekrarKey = (IDSeri: string, tarih: Date) => `${IDSeri}|${formatYerel(tarih)}`;

function olay(
  row: AjandaKayitRow,
  baslangic: Date,
  bitis: Date | null,
  extra: Partial<AjandaOlay>,
): AjandaOlay {
  return {
    key: `${row.IDAjanda}|${formatYerel(baslangic)}`,
    IDAjanda: String(row.IDAjanda),
    IDAjandaSeri: id(row.IDAjandaSeri),
    tekrarTarihi: null,
    tekrarli: false,
    istisna: false,
    baslangic,
    bitis,
    tumGun: Boolean(row.TumGun),
    baslik: row.Baslik,
    aciklama: row.Aciklama,
    konum: row.Konum,
    renk: row.Renk,
    IDAjandaKategori: id(row.IDAjandaKategori),
    kategoriAd: row.KategoriAd,
    tekrarKurali: row.TekrarKurali,
    sahip: Boolean(row.Sahip),
    durum: row.Durum,
    katilimciSayisi: Number(row.KatilimciSayisi ?? 0),
    hatirlatmaDakika: row.HatirlatmaDakika,
    hatirlatmaKanal: row.HatirlatmaKanal,
    ...extra,
  };
}

const kesisir = (bas: Date, son: Date | null, aralikBas: Date, aralikSon: Date) =>
  bas <= aralikSon && (son ?? bas) >= aralikBas;

/**
 * Ajanda_SELECT_ByTarih satırlarını aralıktaki olaylara açar:
 * - tekil kayıtlar olduğu gibi,
 * - seriler RRULE ile tekrarlarına,
 * - istisnalar serinin ilgili tekrarının yerine geçer (Iptal ise gizlenir).
 */
export function ajandaOlaylari(
  rows: AjandaKayitRow[],
  aralikBas: Date,
  aralikSon: Date,
): AjandaOlay[] {
  const sonuc: AjandaOlay[] = [];
  const istisnaKeys = new Set<string>();

  for (const row of rows) {
    if (row.KayitTipi !== "istisna" || !row.IDAjandaSeri || !row.OrijinalTarih) continue;
    istisnaKeys.add(tekrarKey(String(row.IDAjandaSeri), parseYerel(row.OrijinalTarih)));
  }

  for (const row of rows) {
    const bas = parseYerel(row.Baslangic);
    const son = parseYerel(row.Bitis);

    if (row.KayitTipi === "tekil") {
      if (kesisir(bas, son, aralikBas, aralikSon)) sonuc.push(olay(row, bas, son, {}));
      continue;
    }

    if (row.KayitTipi === "istisna") {
      if (row.Iptal || !kesisir(bas, son, aralikBas, aralikSon)) continue;
      sonuc.push(
        olay(row, bas, son, {
          tekrarTarihi: parseYerel(row.OrijinalTarih),
          tekrarli: true,
          istisna: true,
        }),
      );
      continue;
    }

    // seri
    if (!row.TekrarKurali) continue;
    const sure = son ? son.getTime() - bas.getTime() : 0;
    // Aralıktan önce başlayıp aralığa taşan tekrarları da yakala.
    const arama = new Date(aralikBas.getTime() - sure);
    const IDSeri = String(row.IDAjanda);

    let tarihler: Date[];
    try {
      tarihler = tekrarlar(row.TekrarKurali, bas, arama, aralikSon);
    } catch {
      continue; // bozuk kural takvimi düşürmesin
    }

    for (const t of tarihler) {
      if (istisnaKeys.has(tekrarKey(IDSeri, t))) continue;
      sonuc.push(
        olay(row, t, son ? addMilliseconds(t, sure) : null, {
          IDAjandaSeri: IDSeri,
          tekrarTarihi: t,
          tekrarli: true,
        }),
      );
    }
  }

  return sonuc.sort(
    (a, b) =>
      Number(b.tumGun) - Number(a.tumGun) || a.baslangic.getTime() - b.baslangic.getTime(),
  );
}

/** "yyyy-MM-dd" → o günün olayları. Birden fazla güne yayılan olay her güne eklenir. */
export function olaylariGuneGore(
  olaylar: AjandaOlay[],
  aralikBas: Date,
  aralikSon: Date,
): Map<string, AjandaOlay[]> {
  const map = new Map<string, AjandaOlay[]>();

  for (const o of olaylar) {
    const bas = maxDate([startOfDay(o.baslangic), startOfDay(aralikBas)]);
    const son = minDate([endOfDay(o.bitis ?? o.baslangic), endOfDay(aralikSon)]);
    if (bas > son) continue;

    for (const gun of eachDayOfInterval({ start: bas, end: son })) {
      const key = format(gun, "yyyy-MM-dd");
      const arr = map.get(key);
      if (arr) arr.push(o);
      else map.set(key, [o]);
    }
  }

  return map;
}

/**
 * Ajanda_SELECT detayından tek bir olay üretir (ör. mail linki ?ajanda=ID ile
 * açılan kayıt yüklü takvim aralığında yoksa). Seride serinin ilk tekrarı döner.
 */
export function detaydanOlay(data: AjandaDetayResponse): AjandaOlay | null {
  const d = data.kayit;
  if (!d) return null;
  const baslangic = parseYerel(d.Baslangic);
  return {
    key: `${d.IDAjanda}|${formatYerel(baslangic)}`,
    IDAjanda: String(d.IDAjanda),
    IDAjandaSeri: id(d.IDAjandaSeri) ?? (d.TekrarKurali ? String(d.IDAjanda) : null),
    tekrarTarihi: d.OrijinalTarih ? parseYerel(d.OrijinalTarih) : d.TekrarKurali ? baslangic : null,
    tekrarli: Boolean(d.TekrarKurali || d.IDAjandaSeri),
    istisna: d.IDAjandaSeri != null,
    baslangic,
    bitis: parseYerel(d.Bitis),
    tumGun: Boolean(d.TumGun),
    baslik: d.Baslik,
    aciklama: d.Aciklama,
    konum: d.Konum,
    renk: d.Renk ?? d.KategoriRenk,
    IDAjandaKategori: id(d.IDAjandaKategori),
    kategoriAd: d.KategoriAd,
    tekrarKurali: d.TekrarKurali,
    sahip: Boolean(d.Sahip),
    durum: d.Durum,
    katilimciSayisi: data.katilimcilar.length,
    hatirlatmaDakika: d.HatirlatmaDakika,
    hatirlatmaKanal: d.HatirlatmaKanal,
  };
}

/* ------------------------------------------------------------------ */
/* Uygulama içi hatırlatmalar                                          */
/* ------------------------------------------------------------------ */

/** Hatırlatma, etkinlik başladıktan bu kadar dakika sonrasına kadar gösterilir. */
export const HATIRLATMA_TOLERANS_DK = 15;

/**
 * Ajanda_SELECT_HatirlatmaAdaylari sonucundan zamanı gelmiş hatırlatmaları
 * çıkarır. Tekil kayıtları SQL zaten süzmüştür; serilerde sıradaki tekrar
 * RRULE ile bulunur, iptal edilmiş / taşınmış tekrarlar istisnalardan okunur.
 */
export function zamaniGelenHatirlatmalar(
  data: AjandaHatirlatmaResponse,
  simdi = new Date(),
): AjandaHatirlatma[] {
  const alt = new Date(simdi.getTime() - HATIRLATMA_TOLERANS_DK * 60_000);
  const istisnalar = new Map(
    data.istisnalar.map((i) => [tekrarKey(String(i.IDAjandaSeri), parseYerel(i.OrijinalTarih)), i]),
  );
  const sonuc: AjandaHatirlatma[] = [];

  const ekle = (IDAjanda: string, baslik: string, konum: string | null, renk: string | null, tumGun: boolean, baslangic: Date, dakika: number) => {
    if (baslangic < alt) return;
    if (baslangic.getTime() - dakika * 60_000 > simdi.getTime()) return;
    sonuc.push({ key: `${IDAjanda}|${formatYerel(baslangic)}`, IDAjanda, baslik, konum, renk, tumGun, baslangic });
  };

  for (const a of data.adaylar) {
    const IDAjanda = String(a.IDAjanda);
    const bas = parseYerel(a.Baslangic);

    if (!a.TekrarKurali) {
      ekle(IDAjanda, a.Baslik, a.Konum, a.Renk, Boolean(a.TumGun), bas, a.HatirlatmaDakika);
      continue;
    }

    // Seri: alt sınırdan sonraki ilk tekrar (taşınmışsa istisnanın saati).
    let t: Date | null;
    try {
      t = sonrakiTekrar(a.TekrarKurali, bas, alt);
    } catch {
      continue;
    }
    if (!t) continue;

    const ist = istisnalar.get(tekrarKey(IDAjanda, t));
    if (ist?.Iptal) continue;
    ekle(
      IDAjanda,
      ist?.Baslik ?? a.Baslik,
      ist ? ist.Konum : a.Konum,
      a.Renk,
      Boolean(ist?.TumGun ?? a.TumGun),
      ist ? parseYerel(ist.Baslangic) : t,
      a.HatirlatmaDakika,
    );
  }

  return sonuc.sort((x, y) => x.baslangic.getTime() - y.baslangic.getTime());
}
