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
