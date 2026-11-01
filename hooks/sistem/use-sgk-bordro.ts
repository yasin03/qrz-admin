import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sgkBordroService } from "@/services/sistem/sgk-bordro.service";
import {
  IzinLimitDeleteRequestType,
  IzinLimitInsertRequestType,
  IzinLimitUpdateRequestType,
  TatilDeleteRequestType,
  TatilInsertRequestType,
  TatilUpdateRequestType,
} from "@/types/sistem/sgk-bordro";

export const TATIL_QUERY_KEY = "tatil-list";
export const IZIN_LIMIT_QUERY_KEY = "izin-limit-list";

/** Seçilen yıla ait tatiller. */
export function useTatilList(Yil: string, enabled = true) {
  return useQuery({
    queryKey: [TATIL_QUERY_KEY, Yil],
    queryFn: () => sgkBordroService.tatilSelect({ Yil }),
    enabled: enabled && Boolean(Yil),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertTatil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TatilInsertRequestType) =>
      sgkBordroService.tatilInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TATIL_QUERY_KEY] });
    },
  });
}

export function useUpdateTatil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TatilUpdateRequestType) =>
      sgkBordroService.tatilUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TATIL_QUERY_KEY] });
    },
  });
}

export function useDeleteTatil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TatilDeleteRequestType) =>
      sgkBordroService.tatilDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TATIL_QUERY_KEY] });
    },
  });
}

// ---- İzin Limitleri -------------------------------------------------------

export function useIzinLimitList(enabled = true) {
  return useQuery({
    queryKey: [IZIN_LIMIT_QUERY_KEY],
    queryFn: () => sgkBordroService.izinLimitSelect(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertIzinLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinLimitInsertRequestType) =>
      sgkBordroService.izinLimitInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_LIMIT_QUERY_KEY] });
    },
  });
}

export function useUpdateIzinLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinLimitUpdateRequestType) =>
      sgkBordroService.izinLimitUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_LIMIT_QUERY_KEY] });
    },
  });
}

export function useDeleteIzinLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinLimitDeleteRequestType) =>
      sgkBordroService.izinLimitDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_LIMIT_QUERY_KEY] });
    },
  });
}
