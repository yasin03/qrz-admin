import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CRM_FINANS_QUERY_KEYS } from "@/modules/crm/hooks/use-finans";
import {
  CRM_AKTIVITE_LIST_QUERY_KEY,
  CRM_KISI_LIST_QUERY_KEY,
} from "@/modules/crm/hooks/use-kisiler";
import {
  CRM_TEKLIF_DETAY_QUERY_KEY,
  CRM_TEKLIF_LIST_QUERY_KEY,
  CRM_TEKLIF_REVIZYON_QUERY_KEY,
} from "@/modules/crm/hooks/use-teklif";
import { satisService } from "@/modules/crm/services/satis.service";
import type {
  CrmSatisGuncelleParams,
  CrmSatisIptalParams,
  CrmSatisKaydetParams,
  CrmSatisListeFiltre,
  CrmSatisYenileParams,
  DbId,
} from "@/modules/crm/types/satis";

export const CRM_SATIS_LIST_QUERY_KEY = "crm-satis-list";
export const CRM_SATIS_DETAY_QUERY_KEY = "crm-satis-detay";
export const CRM_SATIS_YENILEME_QUERY_KEY = "crm-satis-yenileme";

/* ------------------------------------------------------------------ */
/* Sorgular                                                            */
/* ------------------------------------------------------------------ */

/** Satış listesi. Boş filtre → şirketin tüm satışları. */
export function useCrmSatislar(filtre: CrmSatisListeFiltre = {}, enabled = true) {
  const IDCrmKisi = filtre.IDCrmKisi ?? null;
  const Durum = filtre.Durum ?? null;
  const SatisTipi = filtre.SatisTipi ?? null;

  return useQuery({
    queryKey: [CRM_SATIS_LIST_QUERY_KEY, String(IDCrmKisi ?? ""), Durum, SatisTipi],
    queryFn: () => satisService.list({ IDCrmKisi, Durum, SatisTipi }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Satış listesi alınamadı." },
  });
}

/** Başlık + kalemler. */
export function useCrmSatisDetay(IDCrmSatis: DbId | null | undefined) {
  return useQuery({
    queryKey: [CRM_SATIS_DETAY_QUERY_KEY, String(IDCrmSatis)],
    queryFn: () => satisService.detay(IDCrmSatis!),
    enabled: IDCrmSatis != null && IDCrmSatis !== "",
    meta: { hataMesaji: "Satış bilgileri alınamadı." },
  });
}

/**
 * Yenilemesi yaklaşan abonelikler (uyarı bandı). Gun boş → 30.
 * Arka plan bilgisi: hata toast'ı gösterilmez.
 */
export function useCrmSatisYenilemeleri(Gun: number | null = null, enabled = true) {
  return useQuery({
    queryKey: [CRM_SATIS_YENILEME_QUERY_KEY, Gun],
    queryFn: () => satisService.yenilemeList({ Gun }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: false },
  });
}

/* ------------------------------------------------------------------ */
/* Mutasyonlar                                                         */
/* ------------------------------------------------------------------ */

/**
 * Satış değişince:
 * - satış sorguları,
 * - finans sorguları (alacak / bakiye satış toplamından hesaplanır),
 * - teklif sorguları (dönüşüm / iptal / silme teklifin IDCrmSatis bağını değiştirir),
 * - kişi ve aktivite listeleri (Kontak → Müşteri, satış aktivitesi)
 * tazelenir.
 */
function useCrmSatisYenile() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
      CRM_SATIS_LIST_QUERY_KEY,
      CRM_SATIS_DETAY_QUERY_KEY,
      CRM_SATIS_YENILEME_QUERY_KEY,
      ...CRM_FINANS_QUERY_KEYS,
      CRM_TEKLIF_LIST_QUERY_KEY,
      CRM_TEKLIF_DETAY_QUERY_KEY,
      CRM_TEKLIF_REVIZYON_QUERY_KEY,
      CRM_KISI_LIST_QUERY_KEY,
      CRM_AKTIVITE_LIST_QUERY_KEY,
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

/** Döner: { IDCrmSatis, SatisNo }. */
export function useInsertCrmSatis() {
  const yenile = useCrmSatisYenile();
  return useMutation({
    mutationFn: (params: CrmSatisKaydetParams) => satisService.insert(params),
    onSuccess: yenile,
  });
}

export function useUpdateCrmSatis() {
  const yenile = useCrmSatisYenile();
  return useMutation({
    mutationFn: (params: CrmSatisGuncelleParams) => satisService.update(params),
    onSuccess: yenile,
  });
}

export function useIptalCrmSatis() {
  const yenile = useCrmSatisYenile();
  return useMutation({
    mutationFn: (params: CrmSatisIptalParams) => satisService.iptal(params),
    onSuccess: yenile,
  });
}

/** Abonelik → bir sonraki dönem. Döner: yeni { IDCrmSatis, SatisNo }. */
export function useYenileCrmSatis() {
  const yenile = useCrmSatisYenile();
  return useMutation({
    mutationFn: (params: CrmSatisYenileParams) => satisService.yenile(params),
    onSuccess: yenile,
  });
}

export function useDeleteCrmSatis() {
  const yenile = useCrmSatisYenile();
  return useMutation({
    mutationFn: (IDCrmSatis: DbId) => satisService.delete(IDCrmSatis),
    onSuccess: yenile,
  });
}
