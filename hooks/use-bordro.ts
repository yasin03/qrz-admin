import api from "@/lib/axios";
import {
  BordroSelectRequestType,
  BordroHesaplaRequestType,
  BordroHesapSilRequestType,
  BordroOnayRequestType,
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
