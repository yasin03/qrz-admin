import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { personelGrupService } from "@/services/personel-grup.service";
import {
  PersonelGrupDeleteRequestType,
  PersonelGrupInsertRequestType,
  PersonelGrupUpdateRequestType,
} from "@/types/ayarlar/personel-grup";

export const PERSONEL_GRUP_QUERY_KEY = "personel-grup-list";

/** Şirketin personel grupları (IDSirket session'dan). */
export function usePersonelGrupList(enabled = true) {
  return useQuery({
    queryKey: [PERSONEL_GRUP_QUERY_KEY],
    queryFn: () => personelGrupService.select(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertPersonelGrup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: PersonelGrupInsertRequestType) =>
      personelGrupService.insert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONEL_GRUP_QUERY_KEY] });
    },
  });
}

export function useUpdatePersonelGrup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: PersonelGrupUpdateRequestType) =>
      personelGrupService.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONEL_GRUP_QUERY_KEY] });
    },
  });
}

export function useDeletePersonelGrup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: PersonelGrupDeleteRequestType) =>
      personelGrupService.delete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONEL_GRUP_QUERY_KEY] });
    },
  });
}
