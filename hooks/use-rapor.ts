import { raporService } from "@/services/rapor.service";
import { PdksRaporSelectRequestType } from "@/types/rapor";
import { useQuery } from "@tanstack/react-query";

export const PDKS_RAPOR_QUERY_KEY = "pdks-rapor";

export function usePdksRapor(
  params: PdksRaporSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [PDKS_RAPOR_QUERY_KEY, params],
    queryFn: () => raporService.selectPdks(params),
    enabled:
      enabled &&
      Boolean(params.IDSube) &&
      Boolean(params.Tarih1) &&
      Boolean(params.Tarih2),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}
