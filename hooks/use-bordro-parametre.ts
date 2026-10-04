import { bordroParametreService } from "@/services/bordro-parametre.service";
import {
  EklentiDeleteRequestType,
  EklentiInsertRequestType,
  EklentiSelectRequestType,
  EklentiUpdateRequestType,
  KesintiDeleteRequestType,
  KesintiInsertRequestType,
  KesintiSelectRequestType,
  KesintiUpdateRequestType,
} from "@/types/bordro-parametre";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const EKLENTI_QUERY_KEY = "eklenti-list";
export const KESINTI_QUERY_KEY = "kesinti-list";

export function useEklentiList(
  params: EklentiSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [EKLENTI_QUERY_KEY, params],
    queryFn: () => bordroParametreService.selectEklenti(params),
    enabled: enabled && Boolean(params.IDSube),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertEklenti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EklentiInsertRequestType) =>
      bordroParametreService.insertEklenti(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EKLENTI_QUERY_KEY] });
    },
  });
}

export function useUpdateEklenti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EklentiUpdateRequestType) =>
      bordroParametreService.updateEklenti(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EKLENTI_QUERY_KEY] });
    },
  });
}

export function useDeleteEklenti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EklentiDeleteRequestType) =>
      bordroParametreService.deleteEklenti(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EKLENTI_QUERY_KEY] });
    },
  });
}

// ---- Kesinti ------------------------------------------------------------

export function useKesintiList(
  params: KesintiSelectRequestType,
  enabled = true,
) {
  return useQuery({
    queryKey: [KESINTI_QUERY_KEY, params],
    queryFn: () => bordroParametreService.selectKesinti(params),
    enabled: enabled && Boolean(params.IDSube),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertKesinti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KesintiInsertRequestType) =>
      bordroParametreService.insertKesinti(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KESINTI_QUERY_KEY] });
    },
  });
}

export function useUpdateKesinti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KesintiUpdateRequestType) =>
      bordroParametreService.updateKesinti(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KESINTI_QUERY_KEY] });
    },
  });
}

export function useDeleteKesinti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KesintiDeleteRequestType) =>
      bordroParametreService.deleteKesinti(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KESINTI_QUERY_KEY] });
    },
  });
}
