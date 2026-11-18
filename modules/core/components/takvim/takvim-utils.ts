import { eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

import type { TakvimGunTipi, TakvimGunu } from "@/modules/core/types/takvim";

export const WEEK_OPTS = { weekStartsOn: 1 } as const;

export const HAFTA_GUNLERI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export const dateKey = (date: Date) => format(date, "yyyy-MM-dd");

export const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

/** Ay görünümünün grid'i: ayın ilk haftasının pazartesisinden son haftanın pazarına. */
export function getMonthGrid(date: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), WEEK_OPTS),
    end: endOfWeek(endOfMonth(date), WEEK_OPTS),
  });
}

export const TIP_ETIKET: Record<TakvimGunTipi, string> = {
  resmi: "Resmî tatil",
  arife: "Arife (yarım gün)",
  ozel: "Özel gün",
};

/** Etkinlik çipleri (kart içinde). */
export const TIP_CHIP: Record<TakvimGunTipi, string> = {
  resmi: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  arife: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  ozel: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

/** Lejant ve noktalar. */
export const TIP_DOT: Record<TakvimGunTipi, string> = {
  resmi: "bg-red-500",
  arife: "bg-yellow-400",
  ozel: "bg-sky-500",
};

/** Günün en baskın tipi (resmi > arife > ozel). Liste zaten bu sırada geliyor. */
export const baskinTip = (gunler?: TakvimGunu[]) => gunler?.[0]?.type;

/* ---------------- Ajanda ---------------- */

/** Renk seçicideki hazır palet (hex). Kategori seed renkleriyle uyumlu. */
export const AJANDA_RENKLERI = [
  "#2563EB", // mavi
  "#0D9488", // camgöbeği
  "#16A34A", // yeşil
  "#CA8A04", // hardal
  "#EA580C", // turuncu
  "#DC2626", // kırmızı
  "#DB2777", // pembe
  "#7C3AED", // mor
  "#475569", // gri
] as const;

/** Renk/kategori seçilmemiş kayıtlar için. */
export const AJANDA_VARSAYILAN_RENK = "#475569";

/** Hatırlatma seçenekleri (dakika). */
export const HATIRLATMA_SECENEKLERI = [
  { value: "0", label: "Başladığında" },
  { value: "5", label: "5 dakika önce" },
  { value: "10", label: "10 dakika önce" },
  { value: "15", label: "15 dakika önce" },
  { value: "30", label: "30 dakika önce" },
  { value: "60", label: "1 saat önce" },
  { value: "120", label: "2 saat önce" },
  { value: "1440", label: "1 gün önce" },
  { value: "2880", label: "2 gün önce" },
  { value: "10080", label: "1 hafta önce" },
] as const;
