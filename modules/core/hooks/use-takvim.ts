import { useQueries } from "@tanstack/react-query";

import { takvimService, type TatilResponse } from "@/modules/core/services/takvim.service";
import { getOzelGunler } from "@/modules/core/lib/takvim-gunleri";
import type { TakvimGunu } from "@/modules/core/types/takvim";

export const TAKVIM_TATIL_QUERY_KEY = "takvim-tatiller";

const TIP_SIRASI = { resmi: 0, arife: 1, ozel: 2 } as const;

function birlestir(years: number[], responses: (TatilResponse | undefined)[]) {
  const list: TakvimGunu[] = [];
  years.forEach((year, i) => {
    list.push(...(responses[i]?.gunler ?? []), ...getOzelGunler(year));
  });
  list.sort(
    (a, b) => a.date.localeCompare(b.date) || TIP_SIRASI[a.type] - TIP_SIRASI[b.type],
  );

  const byDate = new Map<string, TakvimGunu[]>();
  for (const gun of list) {
    const arr = byDate.get(gun.date);
    if (arr) arr.push(gun);
    else byDate.set(gun.date, [gun]);
  }
  return { list, byDate };
}

/**
 * Verilen yıllar için resmî tatilleri (API) ve özel günleri (yerel) birleştirir.
 * byDate: "yyyy-MM-dd" -> o günün kayıtları (resmi > arife > ozel sırasıyla).
 */
export function useTakvimGunleri(years: number[]) {
  const uniqueYears = [...new Set(years)].sort();

  return useQueries({
    queries: uniqueYears.map((year) => ({
      queryKey: [TAKVIM_TATIL_QUERY_KEY, year],
      queryFn: () => takvimService.tatiller(year),
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24,
    })),
    // combine sonucu react-query tarafından yapısal olarak memoize edilir.
    combine: (results) => ({
      ...birlestir(uniqueYears, results.map((r) => r.data)),
      isLoading: results.some((r) => r.isLoading),
      isFallback: results.some((r) => r.data?.source === "fallback"),
    }),
  });
}
