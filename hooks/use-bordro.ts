import api from "@/lib/axios";
import {
  BordroSelectRequestType,
  BordroHesaplaRequestType,
  BordroHesapSilRequestType,
  BordroOnayRequestType,
  BordroSelectByIdRequestType,
  BordroRaporRequestType,
  BordroLogRequestType,
  BordroLogType,
  BordroResponseType,
} from "@/types/bordro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ENDPOINT = "/api/bordro";
export const QUERY_KEY = "bordro-list";

export function useBordroList(params: BordroSelectRequestType, enabled = true) {
  return useQuery({
    queryKey: [
      QUERY_KEY,
      params.IDSube,
      params.IDBolum,
      params.Yil,
      params.Ay,
      params.Adi,
      params.TcKimlikNo,
    ],
    queryFn: async () => {
      const { data } = await api.post<any[]>(ENDPOINT, {
        type: "SELECT_BORDRO",
        ...params,
      });
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}
export function useBordroById(
  params: BordroSelectByIdRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [QUERY_KEY, params.IDSubePersonel, params.Yil, params.Ay],
    queryFn: async () => {
      const { data } = await api.post<any[]>(ENDPOINT, {
        type: "SELECT_BORDRO_BYID",
        ...params,
      });
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

// QUERY_KEY altında: hesapla/temizle/onay sonrası rapor da tazelenir.
export function useBordroRapor(
  params: BordroRaporRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [QUERY_KEY, "rapor", params.IDBordro],
    queryFn: async () => {
      const { data } = await api.post<BordroResponseType[]>(ENDPOINT, {
        type: "SELECT_BORDRORAPOR",
        ...params,
      });
      return data?.[0] ?? null;
    },
    enabled: enabled && Boolean(Number(params.IDBordro)),
  });
}

export function useBordroLog(params: BordroLogRequestType, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEY, "log", params.IDSubePersonel, params.Yil, params.Ay],
    queryFn: async () => {
      const { data } = await api.post<BordroLogType[]>(ENDPOINT, {
        type: "SELECT_BORDROLOG",
        ...params,
      });
      return data ?? [];
    },
    enabled: enabled && Boolean(params.IDSubePersonel),
    // Yeniden hesaplamadan sonra güncel log görünsün
    staleTime: 0,
  });
}

export function useHesaplaBordro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BordroHesaplaRequestType) => {
      const { data } = await api.post(ENDPOINT, {
        type: "HESAPLA_BORDRO",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useHesapSilBordro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BordroHesapSilRequestType) => {
      const { data } = await api.post(ENDPOINT, {
        type: "HESAP_SIL_BORDRO",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useOnaylaBordro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BordroOnayRequestType) => {
      const { data } = await api.post(ENDPOINT, {
        type: "ONAYLA_BORDRO",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
