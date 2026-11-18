import { RRule } from "rrule";
import { endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";

/*
 * Formdaki tekrar seçenekleri ↔ RRULE metni ↔ Türkçe özet.
 * UI yalnızca şu alt kümeyi üretir: günlük, hafta içi, haftalık (gün seçimli),
 * aylık (ayın X. günü / N. haftanın günü), yıllık + bitiş (asla / tarih / N kez).
 */

export const GUN_KODLARI = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type GunKodu = (typeof GUN_KODLARI)[number];

export const GUN_ADLARI: Record<GunKodu, string> = {
  MO: "Pazartesi",
  TU: "Salı",
  WE: "Çarşamba",
  TH: "Perşembe",
  FR: "Cuma",
  SA: "Cumartesi",
  SU: "Pazar",
};

export const GUN_KISA: Record<GunKodu, string> = {
  MO: "Pzt",
  TU: "Sal",
  WE: "Çar",
  TH: "Per",
  FR: "Cum",
  SA: "Cmt",
  SU: "Paz",
};

export type TekrarTip = "yok" | "gunluk" | "haftaici" | "haftalik" | "aylik" | "yillik";
export type AylikTip = "gun" | "haftagunu";
export type TekrarBitisTip = "asla" | "tarih" | "sayi";

export type TekrarDegerleri = {
  tip: TekrarTip;
  /** "Her N günde/haftada/ayda/yılda bir" */
  aralik: number;
  /** Haftalık için seçili günler. */
  gunler: GunKodu[];
  aylikTip: AylikTip;
  bitisTip: TekrarBitisTip;
  /** "yyyy-MM-dd" */
  bitisTarih: string;
  sayi: number;
};

export const VARSAYILAN_TEKRAR: TekrarDegerleri = {
  tip: "yok",
  aralik: 1,
  gunler: [],
  aylikTip: "gun",
  bitisTip: "asla",
  bitisTarih: "",
  sayi: 10,
};

const HAFTA_ICI: GunKodu[] = ["MO", "TU", "WE", "TH", "FR"];

export const gunKodu = (d: Date): GunKodu => GUN_KODLARI[(d.getDay() + 6) % 7];

/** Ayın kaçıncı haftasının günü (1–4), 5. hafta ise "son" (-1). */
export function ayinHaftasi(d: Date) {
  if (d.getDate() + 7 > endOfMonth(d).getDate()) return -1;
  return Math.ceil(d.getDate() / 7);
}

const haftaAdi = (n: number) => (n === -1 ? "son" : `${n}.`);

/** Form değerleri → RRULE (tekrarsızsa null). */
export function tekrarKuraliOlustur(t: TekrarDegerleri, baslangic: Date): string | null {
  const aralik = Math.max(1, Math.floor(t.aralik) || 1);
  const parcalar: string[] = [];

  switch (t.tip) {
    case "yok":
      return null;
    case "gunluk":
      parcalar.push("FREQ=DAILY");
      break;
    case "haftaici":
      parcalar.push("FREQ=WEEKLY", `BYDAY=${HAFTA_ICI.join(",")}`);
      break;
    case "haftalik": {
      const gunler = t.gunler.length ? t.gunler : [gunKodu(baslangic)];
      const sirali = GUN_KODLARI.filter((g) => gunler.includes(g));
      parcalar.push("FREQ=WEEKLY", `BYDAY=${sirali.join(",")}`);
      break;
    }
    case "aylik":
      parcalar.push(
        "FREQ=MONTHLY",
        t.aylikTip === "haftagunu"
          ? `BYDAY=${ayinHaftasi(baslangic)}${gunKodu(baslangic)}`
          : `BYMONTHDAY=${baslangic.getDate()}`,
      );
      break;
    case "yillik":
      parcalar.push("FREQ=YEARLY");
      break;
  }

  if (aralik > 1 && t.tip !== "haftaici") parcalar.splice(1, 0, `INTERVAL=${aralik}`);

  if (t.bitisTip === "tarih" && t.bitisTarih) {
    parcalar.push(`UNTIL=${t.bitisTarih.replaceAll("-", "")}T235959`);
  } else if (t.bitisTip === "sayi") {
    parcalar.push(`COUNT=${Math.max(1, Math.floor(t.sayi) || 1)}`);
  }

  return parcalar.join(";");
}

// rrule Weekday.weekday: 0 = Pazartesi
const kodOf = (w: number) => GUN_KODLARI[w];

/** RRULE → form değerleri (düzenleme formunu doldurmak için). */
export function tekrarDegerleri(kural: string | null | undefined): TekrarDegerleri {
  if (!kural) return { ...VARSAYILAN_TEKRAR };

  const o = RRule.parseString(kural.replace(/^RRULE:/i, ""));
  const gunlerRaw = (Array.isArray(o.byweekday) ? o.byweekday : o.byweekday != null ? [o.byweekday] : [])
    .map((w) => (typeof w === "number" ? { weekday: w, n: undefined } : (w as { weekday: number; n?: number })));
  const gunler = gunlerRaw.map((w) => kodOf(w.weekday));

  let tip: TekrarTip = "gunluk";
  if (o.freq === RRule.WEEKLY) {
    const haftaIci =
      gunler.length === 5 && HAFTA_ICI.every((g) => gunler.includes(g)) && (o.interval ?? 1) === 1;
    tip = haftaIci ? "haftaici" : "haftalik";
  } else if (o.freq === RRule.MONTHLY) tip = "aylik";
  else if (o.freq === RRule.YEARLY) tip = "yillik";

  const until = o.until
    ? `${o.until.getUTCFullYear()}-${String(o.until.getUTCMonth() + 1).padStart(2, "0")}-${String(o.until.getUTCDate()).padStart(2, "0")}`
    : "";

  return {
    tip,
    aralik: o.interval ?? 1,
    gunler: tip === "haftalik" ? gunler : [],
    aylikTip: tip === "aylik" && gunlerRaw.some((w) => w.n) ? "haftagunu" : "gun",
    bitisTip: o.count ? "sayi" : o.until ? "tarih" : "asla",
    bitisTarih: until,
    sayi: o.count ?? VARSAYILAN_TEKRAR.sayi,
  };
}

/** RRULE → "Her hafta Pazartesi, Çarşamba · 10 kez" gibi kısa Türkçe özet. */
export function tekrarOzeti(kural: string | null | undefined, baslangic: Date): string {
  if (!kural) return "Tekrarlanmaz";

  let t: TekrarDegerleri;
  try {
    t = tekrarDegerleri(kural);
  } catch {
    return "Tekrarlı";
  }

  const n = t.aralik;
  let metin: string;

  switch (t.tip) {
    case "gunluk":
      metin = n > 1 ? `${n} günde bir` : "Her gün";
      break;
    case "haftaici":
      metin = "Hafta içi her gün";
      break;
    case "haftalik": {
      const gunler = (t.gunler.length ? t.gunler : [gunKodu(baslangic)]).map((g) => GUN_ADLARI[g]);
      metin = `${n > 1 ? `${n} haftada bir` : "Her hafta"} ${gunler.join(", ")}`;
      break;
    }
    case "aylik": {
      const onEk = n > 1 ? `${n} ayda bir` : "Her ay";
      metin =
        t.aylikTip === "haftagunu"
          ? `${onEk} ${haftaAdi(ayinHaftasi(baslangic))} ${GUN_ADLARI[gunKodu(baslangic)]}`
          : `${onEk} ${baslangic.getDate()}. gün`;
      break;
    }
    case "yillik":
      metin = `${n > 1 ? `${n} yılda bir` : "Her yıl"} ${format(baslangic, "d MMMM", { locale: tr })}`;
      break;
    default:
      metin = "Tekrarlı";
  }

  if (t.bitisTip === "sayi") metin += ` · ${t.sayi} kez`;
  else if (t.bitisTip === "tarih" && t.bitisTarih) {
    const [y, m, d] = t.bitisTarih.split("-").map(Number);
    metin += ` · ${format(new Date(y, m - 1, d), "d MMM yyyy", { locale: tr })} tarihine kadar`;
  }

  return metin;
}

/** Aylık seçeneğin iki etiketi (form açılır listesi için). */
export function aylikSecenekleri(baslangic: Date) {
  return [
    { value: "gun", label: `Ayın ${baslangic.getDate()}. günü` },
    {
      value: "haftagunu",
      label: `Ayın ${haftaAdi(ayinHaftasi(baslangic))} ${GUN_ADLARI[gunKodu(baslangic)]} günü`,
    },
  ];
}
