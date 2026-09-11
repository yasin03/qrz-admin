"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  BolumVardiyaInsertInput,
  BolumVardiyaSaat,
  BolumVardiyaUpdateInput,
  PDKSSelectRequestType,
  PDKSSelectResponseType,
  SubeVardiyaInsertInput,
  SubeVardiyaSaat,
  SubeVardiyaUpdateInput,
} from "@/types/pdks";

const ENDPOINT = "/api/pdks";
const SUBE_QUERY_KEY = "sube-vardiya-saat";
const BOLUM_QUERY_KEY = "bolum-vardiya-saat";

export function usePdksList(params: PDKSSelectRequestType, enabled = true) {
  return useQuery({
    queryKey: [
      SUBE_QUERY_KEY,
      params.IDSube,
      params.IDBolum,
      params.Tarih1,
      params.Tarih2,
    ],
    queryFn: async () => {
      const { data } = await api.post<PDKSSelectResponseType[]>(ENDPOINT, {
        type: "SELECT_PDKS",
        ...params,
      });

      return data;
    },
    enabled,
  });
}

// ---- Şube Vardiya Ayar -------------------------------------------------------------

export function useSubeVardiyaList(enabled = true) {
  return useQuery({
    queryKey: [SUBE_QUERY_KEY],
    queryFn: async () => {
      const { data } = await api.post<SubeVardiyaSaat[]>(ENDPOINT, {
        type: "SELECT_PDKS_SUBE",
      });
      return data;
    },
    enabled,
  });
}

export function useInsertSubeVardiya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubeVardiyaInsertInput) => {
      const { data } = await api.post(ENDPOINT, {
        type: "INSERT_PDKS_SUBE",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBE_QUERY_KEY] });
    },
  });
}

export function useUpdateSubeVardiya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubeVardiyaUpdateInput) => {
      const { data } = await api.post(ENDPOINT, {
        type: "UPDATE_PDKS_SUBE",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBE_QUERY_KEY] });
    },
  });
}

export function useDeleteSubeVardiya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { IDSubeVardiyaSaat: number }) => {
      const { data } = await api.post(ENDPOINT, {
        type: "DELETE_PDKS_SUBE",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBE_QUERY_KEY] });
    },
  });
}

// ---- Bölüm --------------------------------------------------------------

export function useBolumVardiyaList(idBolum: number | null, enabled = true) {
  return useQuery({
    queryKey: [BOLUM_QUERY_KEY, idBolum],
    queryFn: async () => {
      const { data } = await api.post<BolumVardiyaSaat[]>(ENDPOINT, {
        type: "SELECT_PDKS_BOLUM",
        IDBolum: idBolum,
      });
      return data;
    },
    enabled: enabled && idBolum !== null,
  });
}

export function useInsertBolumVardiya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BolumVardiyaInsertInput) => {
      const { data } = await api.post(ENDPOINT, {
        type: "INSERT_PDKS_BOLUM",
        ...payload,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [BOLUM_QUERY_KEY, variables.IDBolum],
      });
    },
  });
}

export function useUpdateBolumVardiya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BolumVardiyaUpdateInput) => {
      const { data } = await api.post(ENDPOINT, {
        type: "UPDATE_PDKS_BOLUM",
        ...payload,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [BOLUM_QUERY_KEY, variables.IDBolum],
      });
    },
  });
}

export function useDeleteBolumVardiya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { IDBolumVardiyaSaat: number }) => {
      const { data } = await api.post(ENDPOINT, {
        type: "DELETE_PDKS_BOLUM",
        ...payload,
      });
      return data;
    },
    onSuccess: () => {
      // hangi IDBolum'a ait olduğunu bilmiyoruz, tüm bölüm sorgularını geçersiz kıl
      queryClient.invalidateQueries({ queryKey: [BOLUM_QUERY_KEY] });
    },
  });
}
