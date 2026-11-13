import { raporService } from "@/modules/bordro/services/rapor.service";
import {
  AvansRaporSelectRequestType,
  IzinRaporGenelSelectRequestType,
  IzinRaporYillikSelectRequestType,
  PdksRaporSelectRequestType,
} from "@/modules/bordro/types/rapor";
import { useQuery } from "@tanstack/react-query";

export const PDKS_RAPOR_QUERY_KEY = "pdks-rapor";
export const AVANS_RAPOR_QUERY_KEY = "avans-rapor";
export const IZIN_RAPOR_GENEL_QUERY_KEY = "izin-rapor-genel";
export const IZIN_RAPOR_YILLIK_QUERY_KEY = "izin-rapor-yillik";

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

export function useAvansRapor(
  params: AvansRaporSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [AVANS_RAPOR_QUERY_KEY, params],
    queryFn: () => raporService.selectAvans(params),
    enabled:
      enabled &&
      Boolean(params.IDSirket) &&
      Boolean(params.BaslangicTarihi) &&
      Boolean(params.BitisTarihi),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useIzinRaporGenel(
  params: IzinRaporGenelSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [IZIN_RAPOR_GENEL_QUERY_KEY, params],
    queryFn: () => raporService.selectIzinGenel(params),
    enabled:
      enabled &&
      Boolean(params.IDSirket) &&
      Boolean(params.BaslangicTarihi) &&
      Boolean(params.BitisTarihi),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useIzinRaporYillik(
  params: IzinRaporYillikSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [IZIN_RAPOR_YILLIK_QUERY_KEY, params],
    queryFn: () => raporService.selectIzinYillik(params),
    enabled:
      enabled &&
      Boolean(params.IDSirket) &&
      Boolean(params.Yil) &&
      Boolean(params.BitisTarihi),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}
