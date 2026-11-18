import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ajandaOlaylari,
  formatYerel,
  olaylariGuneGore,
  parseYerel,
  zamaniGelenHatirlatmalar,
} from "@/modules/core/lib/ajanda";
import { ajandaService } from "@/modules/core/services/ajanda.service";
import type {
  AjandaGuncelleParams,
  AjandaHatirlatmaKanal,
  AjandaIstisnaParams,
  AjandaKatilimDurumu,
  AjandaKategoriKaydetParams,
  AjandaKaydetParams,
  DbId,
} from "@/modules/core/types/takvim";

export const AJANDA_LIST_QUERY_KEY = "ajanda-list";
export const AJANDA_DETAY_QUERY_KEY = "ajanda-detay";
export const AJANDA_KATEGORI_QUERY_KEY = "ajanda-kategori";
export const AJANDA_HATIRLATMA_QUERY_KEY = "ajanda-hatirlatma";

/** Uygulama içi hatırlatma kontrol aralığı. */
export const AJANDA_HATIRLATMA_ARALIGI = 60 * 1000; // 60 saniye

/* ------------------------------------------------------------------ */
/* Sorgular                                                            */
/* ------------------------------------------------------------------ */

/**
 * Aralıktaki ajanda olayları. Seriler tekrarlarına açılmış, istisnalar
 * uygulanmış halde döner.
 * byDate: "yyyy-MM-dd" → o günün olayları (çok günlük olaylar her güne eklenir).
 */
export function useAjanda(baslangic: Date, bitis: Date, enabled = true) {
  const basKey = formatYerel(baslangic);
  const sonKey = formatYerel(bitis);

  const query = useQuery({
    queryKey: [AJANDA_LIST_QUERY_KEY, basKey, sonKey],
    queryFn: () => ajandaService.list(baslangic, bitis),
    enabled,
    staleTime: 60 * 1000, // 1 dakika
    placeholderData: (onceki) => onceki, // dönem değişirken eski veri kalsın
  });

  const { olaylar, byDate } = useMemo(() => {
    const bas = parseYerel(basKey);
    const son = parseYerel(sonKey);
    const olaylar = ajandaOlaylari(query.data ?? [], bas, son);
    return { olaylar, byDate: olaylariGuneGore(olaylar, bas, son) };
  }, [query.data, basKey, sonKey]);

  return { ...query, olaylar, byDate };
}

/** Tek kayıt detayı + katılımcılar. */
export function useAjandaDetay(IDAjanda: DbId | null | undefined) {
  return useQuery({
    queryKey: [AJANDA_DETAY_QUERY_KEY, String(IDAjanda)],
    queryFn: () => ajandaService.detay(IDAjanda!),
    enabled: IDAjanda != null && IDAjanda !== "",
  });
}

export function useAjandaKategoriler() {
  return useQuery({
    queryKey: [AJANDA_KATEGORI_QUERY_KEY],
    queryFn: () => ajandaService.kategoriList(),
    staleTime: 30 * 60 * 1000, // 30 dakika
  });
}

/**
 * Zamanı gelmiş uygulama içi hatırlatmalar. Her dakika yenilenir.
 * Kapatılanları saklamak (localStorage vb.) çağıran bileşenin işi;
 * her hatırlatmanın sabit bir `key`'i var.
 */
export function useAjandaHatirlatmalar(enabled = true) {
  const query = useQuery({
    queryKey: [AJANDA_HATIRLATMA_QUERY_KEY],
    queryFn: () => ajandaService.hatirlatmalar(),
    enabled,
    refetchInterval: AJANDA_HATIRLATMA_ARALIGI,
    refetchIntervalInBackground: true,
  });

  const hatirlatmalar = useMemo(
    () => (query.data ? zamaniGelenHatirlatmalar(query.data, new Date(query.dataUpdatedAt)) : []),
    [query.data, query.dataUpdatedAt],
  );

  return { ...query, hatirlatmalar };
}

/* ------------------------------------------------------------------ */
/* Mutasyonlar                                                         */
/* ------------------------------------------------------------------ */

/** Ajanda verisi değişince liste, detay ve hatırlatmalar tazelenir. */
function useAjandaYenile() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [AJANDA_LIST_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [AJANDA_DETAY_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [AJANDA_HATIRLATMA_QUERY_KEY] });
  };
}

export function useInsertAjanda() {
  const yenile = useAjandaYenile();
  return useMutation({
    mutationFn: (params: AjandaKaydetParams) => ajandaService.insert(params),
    onSuccess: yenile,
  });
}

/** Tekil kayıt veya serinin tamamı ("tümü"). */
export function useUpdateAjanda() {
  const yenile = useAjandaYenile();
  return useMutation({
    mutationFn: (params: AjandaGuncelleParams) => ajandaService.update(params),
    onSuccess: yenile,
  });
}

/** "Sadece bu tekrar": düzenle veya Iptal=true ile o tekrarı sil. */
export function useUpdateAjandaIstisna() {
  const yenile = useAjandaYenile();
  return useMutation({
    mutationFn: (params: AjandaIstisnaParams) => ajandaService.updateIstisna(params),
    onSuccess: yenile,
  });
}

/** Kaydı (seriyse tüm tekrarlarıyla) siler. */
export function useDeleteAjanda() {
  const yenile = useAjandaYenile();
  return useMutation({
    mutationFn: (IDAjanda: DbId) => ajandaService.delete(IDAjanda),
    onSuccess: yenile,
  });
}

export function useAjandaKatilimDurumu() {
  const yenile = useAjandaYenile();
  return useMutation({
    mutationFn: ({ IDAjanda, Durum }: { IDAjanda: DbId; Durum: AjandaKatilimDurumu }) =>
      ajandaService.katilimDurumu(IDAjanda, Durum),
    onSuccess: yenile,
  });
}

export function useAjandaHatirlatmaAyari() {
  const yenile = useAjandaYenile();
  return useMutation({
    mutationFn: ({
      IDAjanda,
      Dakika,
      Kanal,
    }: {
      IDAjanda: DbId;
      Dakika: number | null;
      Kanal?: AjandaHatirlatmaKanal | null;
    }) => ajandaService.hatirlatmaAyari(IDAjanda, Dakika, Kanal ?? 1),
    onSuccess: yenile,
  });
}

/* ---------------- Kategori ---------------- */

/** Kategori değişince renk/ad listede de değiştiği için ajanda da tazelenir. */
function useKategoriYenile() {
  const queryClient = useQueryClient();
  const yenile = useAjandaYenile();
  return () => {
    queryClient.invalidateQueries({ queryKey: [AJANDA_KATEGORI_QUERY_KEY] });
    yenile();
  };
}

export function useInsertAjandaKategori() {
  const yenile = useKategoriYenile();
  return useMutation({
    mutationFn: (params: AjandaKategoriKaydetParams) => ajandaService.kategoriInsert(params),
    onSuccess: yenile,
  });
}

export function useUpdateAjandaKategori() {
  const yenile = useKategoriYenile();
  return useMutation({
    mutationFn: (params: AjandaKategoriKaydetParams & { IDAjandaKategori: DbId }) =>
      ajandaService.kategoriUpdate(params),
    onSuccess: yenile,
  });
}

export function useDeleteAjandaKategori() {
  const yenile = useKategoriYenile();
  return useMutation({
    mutationFn: (IDAjandaKategori: DbId) => ajandaService.kategoriDelete(IDAjandaKategori),
    onSuccess: yenile,
  });
}
