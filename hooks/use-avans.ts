import { avansService } from "@/services/avans.service";
import { AvansDeleteParams, AvansInsertParams, AvansSelectParams, AvansTalepInsertParams, AvansTalepSelectParams, AvansTalepUpdateParams } from "@/types/avans";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const AVANS_QUERY_KEY = "avans-list";
export const AVANS_TALEP_QUERY_KEY = "avans-talep-list";

export function useAvansList(params: AvansSelectParams, enabled = true) {
  return useQuery({
    queryKey: [AVANS_QUERY_KEY, params],
    queryFn: () => avansService.select(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertAvans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AvansInsertParams) => avansService.insert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AVANS_QUERY_KEY] });
    },
  });
}

export function useDeleteAvans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AvansDeleteParams) => avansService.delete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AVANS_QUERY_KEY] });
    },
  });
}

export function useTalepList(params: AvansTalepSelectParams, enabled = true) {
  return useQuery({
    queryKey: [AVANS_TALEP_QUERY_KEY, params],
    queryFn: () => avansService.selectTalep(params),
    enabled,
  });
}

export function useInsertTalep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AvansTalepInsertParams) =>
      avansService.insertTalep(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AVANS_TALEP_QUERY_KEY] });
    },
  });
}

export function useUpdateTalep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AvansTalepUpdateParams) =>
      avansService.updateTalep(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AVANS_TALEP_QUERY_KEY] });
    },
  });
}
