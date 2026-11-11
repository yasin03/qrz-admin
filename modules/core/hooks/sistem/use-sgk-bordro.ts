import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sgkBordroService } from "@/modules/core/services/sistem/sgk-bordro.service";
import {
  EngelliIndirimDeleteRequestType,
  EngelliIndirimInsertRequestType,
  EngelliIndirimUpdateRequestType,
  IzinLimitDeleteRequestType,
  KidemIhbarDeleteRequestType,
  KidemIhbarInsertRequestType,
  KidemIhbarUpdateRequestType,
  MeslekKoduDeleteRequestType,
  MeslekKoduInsertRequestType,
  MeslekKoduUpdateRequestType,
  KatsayiOranDeleteRequestType,
  KatsayiOranInsertRequestType,
  KatsayiOranUpdateRequestType,
  YilAktarRequestType,
  IzinLimitInsertRequestType,
  IzinLimitUpdateRequestType,
  TatilDeleteRequestType,
  TatilInsertRequestType,
  TatilUpdateRequestType,
  VergiOranDeleteRequestType,
  VergiOranInsertRequestType,
  VergiOranUpdateRequestType,
} from "@/modules/core/types/sistem/sgk-bordro";

export const TATIL_QUERY_KEY = "tatil-list";
export const IZIN_LIMIT_QUERY_KEY = "izin-limit-list";
export const VERGI_ORAN_QUERY_KEY = "vergi-oran-list";
export const KATSAYI_ORAN_QUERY_KEY = "katsayi-oran-list";
export const ENGELLI_INDIRIM_QUERY_KEY = "engelli-indirim-list";
export const MESLEK_KODU_QUERY_KEY = "meslek-kodu-list";
export const KIDEM_IHBAR_QUERY_KEY = "kidem-ihbar-list";

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

// ---- Vergi Yüzde Oranları -------------------------------------------------

/** Seçilen yıla ait vergi dilimleri. */
export function useVergiOranList(Yil: string, enabled = true) {
  return useQuery({
    queryKey: [VERGI_ORAN_QUERY_KEY, Yil],
    queryFn: () => sgkBordroService.vergiOranSelect({ Yil }),
    enabled: enabled && Boolean(Yil),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertVergiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: VergiOranInsertRequestType) =>
      sgkBordroService.vergiOranInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VERGI_ORAN_QUERY_KEY] });
    },
  });
}

export function useUpdateVergiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: VergiOranUpdateRequestType) =>
      sgkBordroService.vergiOranUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VERGI_ORAN_QUERY_KEY] });
    },
  });
}

export function useDeleteVergiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: VergiOranDeleteRequestType) =>
      sgkBordroService.vergiOranDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VERGI_ORAN_QUERY_KEY] });
    },
  });
}

export function useAktarVergiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: YilAktarRequestType) =>
      sgkBordroService.vergiOranAktar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VERGI_ORAN_QUERY_KEY] });
    },
  });
}

// ---- Katsayı Oranları (Gösterge) ------------------------------------------

/** Seçilen yıla ait aylık katsayılar. */
export function useKatsayiOranList(Yil: string, enabled = true) {
  return useQuery({
    queryKey: [KATSAYI_ORAN_QUERY_KEY, Yil],
    queryFn: () => sgkBordroService.katsayiOranSelect({ Yil }),
    enabled: enabled && Boolean(Yil),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertKatsayiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KatsayiOranInsertRequestType) =>
      sgkBordroService.katsayiOranInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KATSAYI_ORAN_QUERY_KEY] });
    },
  });
}

export function useUpdateKatsayiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KatsayiOranUpdateRequestType) =>
      sgkBordroService.katsayiOranUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KATSAYI_ORAN_QUERY_KEY] });
    },
  });
}

export function useDeleteKatsayiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KatsayiOranDeleteRequestType) =>
      sgkBordroService.katsayiOranDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KATSAYI_ORAN_QUERY_KEY] });
    },
  });
}

export function useAktarKatsayiOran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: YilAktarRequestType) =>
      sgkBordroService.katsayiOranAktar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KATSAYI_ORAN_QUERY_KEY] });
    },
  });
}

// ---- Engelli İndirim Oranları ---------------------------------------------

/** Seçilen yıla ait engelli indirim tutarları. */
export function useEngelliIndirimList(Yil: string, enabled = true) {
  return useQuery({
    queryKey: [ENGELLI_INDIRIM_QUERY_KEY, Yil],
    queryFn: () => sgkBordroService.engelliIndirimSelect({ Yil }),
    enabled: enabled && Boolean(Yil),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertEngelliIndirim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EngelliIndirimInsertRequestType) =>
      sgkBordroService.engelliIndirimInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENGELLI_INDIRIM_QUERY_KEY] });
    },
  });
}

export function useUpdateEngelliIndirim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EngelliIndirimUpdateRequestType) =>
      sgkBordroService.engelliIndirimUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENGELLI_INDIRIM_QUERY_KEY] });
    },
  });
}

export function useDeleteEngelliIndirim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: EngelliIndirimDeleteRequestType) =>
      sgkBordroService.engelliIndirimDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENGELLI_INDIRIM_QUERY_KEY] });
    },
  });
}

export function useAktarEngelliIndirim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: YilAktarRequestType) =>
      sgkBordroService.engelliIndirimAktar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENGELLI_INDIRIM_QUERY_KEY] });
    },
  });
}

// ---- Meslek Kodları -------------------------------------------------------

export function useMeslekKoduList(enabled = true) {
  return useQuery({
    queryKey: [MESLEK_KODU_QUERY_KEY],
    queryFn: () => sgkBordroService.meslekKoduSelect(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertMeslekKodu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: MeslekKoduInsertRequestType) =>
      sgkBordroService.meslekKoduInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESLEK_KODU_QUERY_KEY] });
    },
  });
}

export function useUpdateMeslekKodu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: MeslekKoduUpdateRequestType) =>
      sgkBordroService.meslekKoduUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESLEK_KODU_QUERY_KEY] });
    },
  });
}

export function useDeleteMeslekKodu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: MeslekKoduDeleteRequestType) =>
      sgkBordroService.meslekKoduDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESLEK_KODU_QUERY_KEY] });
    },
  });
}

// ---- Kıdem İhbar Tanımları ------------------------------------------------

/** Seçilen yıla ait kıdem/ihbar süre tanımları. */
export function useKidemIhbarList(Yil: string, enabled = true) {
  return useQuery({
    queryKey: [KIDEM_IHBAR_QUERY_KEY, Yil],
    queryFn: () => sgkBordroService.kidemIhbarSelect({ Yil }),
    enabled: enabled && Boolean(Yil),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useInsertKidemIhbar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KidemIhbarInsertRequestType) =>
      sgkBordroService.kidemIhbarInsert(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KIDEM_IHBAR_QUERY_KEY] });
    },
  });
}

export function useUpdateKidemIhbar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KidemIhbarUpdateRequestType) =>
      sgkBordroService.kidemIhbarUpdate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KIDEM_IHBAR_QUERY_KEY] });
    },
  });
}

export function useDeleteKidemIhbar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KidemIhbarDeleteRequestType) =>
      sgkBordroService.kidemIhbarDelete(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KIDEM_IHBAR_QUERY_KEY] });
    },
  });
}

export function useAktarKidemIhbar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: YilAktarRequestType) =>
      sgkBordroService.kidemIhbarAktar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KIDEM_IHBAR_QUERY_KEY] });
    },
  });
}
