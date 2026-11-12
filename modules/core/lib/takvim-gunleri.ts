import type { TakvimGunu } from "@/modules/core/types/takvim";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

/** Ayın n. pazar günü (month: 1-12). */
function nthSunday(year: number, month: number, n: number) {
  const first = new Date(year, month - 1, 1);
  const offset = (7 - first.getDay()) % 7; // ilk pazara kaç gün var
  return iso(year, month, 1 + offset + (n - 1) * 7);
}

/**
 * Tarihi sabit resmî tatiller. Nager.Date API'sine ulaşılamazsa yedek olarak
 * kullanılır (dinî bayramlar hicri takvime bağlı olduğu için burada yok).
 */
export function getSabitResmiTatiller(year: number): TakvimGunu[] {
  return [
    { date: iso(year, 1, 1), name: "Yılbaşı", type: "resmi" },
    { date: iso(year, 4, 23), name: "Ulusal Egemenlik ve Çocuk Bayramı", type: "resmi" },
    { date: iso(year, 5, 1), name: "Emek ve Dayanışma Günü", type: "resmi" },
    { date: iso(year, 5, 19), name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", type: "resmi" },
    { date: iso(year, 7, 15), name: "Demokrasi ve Millî Birlik Günü", type: "resmi" },
    { date: iso(year, 8, 30), name: "Zafer Bayramı", type: "resmi" },
    { date: iso(year, 10, 28), name: "Cumhuriyet Bayramı Arifesi (yarım gün)", type: "arife" },
    { date: iso(year, 10, 29), name: "Cumhuriyet Bayramı", type: "resmi" },
  ];
}

/** Tatil olmayan, takvimde gösterilen anma ve kutlama günleri. */
export function getOzelGunler(year: number): TakvimGunu[] {
  const gunler: [string, string][] = [
    [iso(year, 2, 14), "Sevgililer Günü"],
    [iso(year, 3, 8), "Dünya Kadınlar Günü"],
    [iso(year, 3, 14), "Tıp Bayramı"],
    [iso(year, 3, 18), "Çanakkale Zaferi ve Şehitleri Anma Günü"],
    [iso(year, 3, 21), "Nevruz"],
    [nthSunday(year, 5, 2), "Anneler Günü"],
    [nthSunday(year, 6, 3), "Babalar Günü"],
    [iso(year, 7, 1), "Denizcilik ve Kabotaj Bayramı"],
    [iso(year, 11, 10), "Atatürk'ü Anma Günü"],
    [iso(year, 11, 24), "Öğretmenler Günü"],
    [iso(year, 12, 31), "Yılbaşı Gecesi"],
  ];
  return gunler.map(([date, name]) => ({ date, name, type: "ozel" }));
}
