"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  MesaiCizelgesiSelectRequestType,
  MesaiCizelgesiSelectResponseType,
  PuantajAktarRequestType,
  PuantajAktarResponseType,
  PuantajDeleteRequestType,
  PuantajSelectByIdRequestType,
  PuantajSelectRequestType,
  PuantajUpdateRequestType,
} from "@/modules/bordro/types/puantaj";
import { MESAI_QUERY_KEY } from "@/modules/bordro/hooks/use-bordro-parametre";

const ENDPOINT = "/api/puantaj";
const QUERY_KEY = "puantaj-list";
const MESAI_CIZELGESI_QUERY_KEY = "puantaj-mesai-cizelgesi";

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
      // Aktarım mesai kayıtlarını da oluşturuyor; mesai listesi de yenilensin.
      queryClient.invalidateQueries({ queryKey: [MESAI_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MESAI_CIZELGESI_QUERY_KEY] });
    },
  });
}

/** Şube/bölüm bazında aylık mesai çizelgesi (G1..G31 + mesai toplamları). */
export function useMesaiCizelgesiList(
  params: MesaiCizelgesiSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      MESAI_CIZELGESI_QUERY_KEY,
      params.IDSube,
      params.IDBolum,
      params.Yil,
      params.Ay,
      params.Adi,
      params.TcKimlikNo,
    ],
    queryFn: async () => {
      const { data } = await api.post<MesaiCizelgesiSelectResponseType[]>(
        ENDPOINT,
        { type: "SELECT_MESAI", ...params },
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    enabled,
  });
}
