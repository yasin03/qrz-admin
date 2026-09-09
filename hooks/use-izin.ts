import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { izinService } from "@/services/izin.service";
import {
  IzinSelectParams,
  IzinDeleteParams,
  IzinInsertParams,
} from "@/types/izin";

export const IZIN_QUERY_KEY = "izin-list";

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
