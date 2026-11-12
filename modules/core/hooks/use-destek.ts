import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { destekService } from "@/modules/core/services/destek.service";
import {
  DestekMesajInsertRequestType,
  DestekTalepDeleteRequestType,
  DestekTalepDurumRequestType,
  DestekTalepInsertRequestType,
} from "@/modules/core/types/destek";

export const DESTEK_TALEP_QUERY_KEY = "destek-talep-list";
export const DESTEK_KONU_QUERY_KEY = "destek-konu-list";
export const DESTEK_MESAJ_QUERY_KEY = "destek-mesaj-list";

/** Varsayılan ana uygulama — konular ve talepler bununla çekiliyor. */
export const DESTEK_ANA_UYGULAMA = "1";

/** Kullanıcının şirketine ait destek talepleri (admin için tümü). */
export function useDestekTalepList(enabled = true) {
  return useQuery({
    queryKey: [DESTEK_TALEP_QUERY_KEY],
    queryFn: () => destekService.destekTalepSelect(),
    enabled,
    staleTime: 60 * 1000, // 1 dakika
  });
}

export function useDestekKonuList(
  IDAnaUygulama = DESTEK_ANA_UYGULAMA,
  enabled = true,
) {
  return useQuery({
    queryKey: [DESTEK_KONU_QUERY_KEY, IDAnaUygulama],
    queryFn: () => destekService.destekKonuSelect(IDAnaUygulama),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 dakika
  });
}

export function useInsertDestekTalep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DestekTalepInsertRequestType) =>
      destekService.destekTalepInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESTEK_TALEP_QUERY_KEY] });
    },
  });
}

/** Talebi siler (yalnızca Admin). */
export function useDeleteDestekTalep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DestekTalepDeleteRequestType) =>
      destekService.destekTalepDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESTEK_TALEP_QUERY_KEY] });
    },
  });
}

/** Talebi açar / kapatır (yalnızca Admin). */
export function useChangeDestekTalepDurumu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DestekTalepDurumRequestType) =>
      destekService.destekTalepDurumChange(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DESTEK_TALEP_QUERY_KEY] });
    },
  });
}

/** Talebe ait mesajlar. Drawer açıkken yeni mesajlar için periyodik yenilenir. */
export function useDestekMesajList(
  IDDestekTakip: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: [DESTEK_MESAJ_QUERY_KEY, IDDestekTakip],
    queryFn: () => destekService.destekMesajSelect(IDDestekTakip!),
    enabled: enabled && Boolean(IDDestekTakip),
    refetchInterval: enabled ? 15 * 1000 : false,
  });
}

export function useInsertDestekMesaj() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DestekMesajInsertRequestType) =>
      destekService.destekMesajInsert(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [DESTEK_MESAJ_QUERY_KEY, variables.IDDestekTakip],
      });
      queryClient.invalidateQueries({ queryKey: [DESTEK_TALEP_QUERY_KEY] });
    },
  });
}
