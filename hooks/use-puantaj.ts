"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  PuantajAktarRequestType,
  PuantajAktarResponseType,
  PuantajDeleteRequestType,
  PuantajSelectByIdRequestType,
  PuantajSelectRequestType,
  PuantajUpdateRequestType,
} from "@/types/puantaj";

const ENDPOINT = "/api/puantaj";
const QUERY_KEY = "puantaj-list";

export function usePuantajList(
  params: PuantajSelectRequestType,
  enabled = true,
) {
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
        type: "SELECT_PUANTAJ",
        ...params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    enabled,
  });
}

export function usePuantajById(
  params: PuantajSelectByIdRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [QUERY_KEY, params.Yil, params.Ay],
    queryFn: async () => {
      const { data } = await api.post<any[]>(ENDPOINT, {
        type: "SELECT_PUANTAJ_BYID",
        ...params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    enabled,
  });
}

export function useUpdatePuantaj() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PuantajUpdateRequestType) => {
      const { data } = await api.post(ENDPOINT, {
        type: "UPDATE_PUANTAJ",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeletePuantaj() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PuantajDeleteRequestType) => {
      const { data } = await api.post(ENDPOINT, {
        type: "DELETE_PUANTAJ",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** PDKS kayıtlarını seçilen tarihe göre (günlük/aylık) puantaja aktarır. */
export function useAktarPuantaj() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: PuantajAktarRequestType,
    ): Promise<PuantajAktarResponseType | undefined> => {
      const { data } = await api.post(ENDPOINT, {
        type: "AKTAR_PUANTAJ",
        ...payload,
      });
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
