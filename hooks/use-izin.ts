import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { izinService } from "@/services/izin.service";
import {
  IzinSelectParams,
  IzinDeleteParams,
  IzinInsertParams,
  IzinTalepSelectParams,
  IzinTalepInsertParams,
  IzinSureParams,
  IzinTalepUpdateParams,
} from "@/types/izin";

export const IZIN_QUERY_KEY = "izin-list";
export const IZIN_TALEP_QUERY_KEY = "izin-talep-list";

export function useIzinList(params: IzinSelectParams, enabled = true) {
  return useQuery({
    queryKey: [IZIN_QUERY_KEY, params],
    queryFn: () => izinService.select(params),
    enabled,
  });
}

export function useInsertIzin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinInsertParams) => izinService.insert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_QUERY_KEY] });
    },
  });
}

export function useDeleteIzin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinDeleteParams) => izinService.delete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_QUERY_KEY] });
    },
  });
}

export function useTalepList(params: IzinTalepSelectParams, enabled = true) {
  return useQuery({
    queryKey: [IZIN_TALEP_QUERY_KEY, params],
    queryFn: () => izinService.selectTalep(params),
    enabled,
  });
}

export function useInsertTalep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinTalepInsertParams) =>
      izinService.insertTalep(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_TALEP_QUERY_KEY] });
    },
  });
}

export function useUpdateTalep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: IzinTalepUpdateParams) =>
      izinService.updateTalep(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IZIN_TALEP_QUERY_KEY] });
    },
  });
}

/**
 * IDSubePersonel boşsa (henüz personel/kullanıcı belli değilse) sorguyu
 * tetiklemiyoruz — "enabled" parametresiyle dışarıdan da kontrol edilebilir
 * (örn. sadece izinTipi === "YI" seçiliyken çağırmak için).
 */
export function useIzinSure(params: IzinSureParams, enabled: boolean) {
  return useQuery({
    queryKey: ["izin-sure", params],
    queryFn: () => izinService.getIzinSure(params),
    enabled: enabled && Boolean(params.IDSubePersonel),
    staleTime: 5 * 60 * 1000,
  });
}
