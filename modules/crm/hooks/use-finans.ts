import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CRM_AKTIVITE_LIST_QUERY_KEY } from "@/modules/crm/hooks/use-kisiler";
import { finansService } from "@/modules/crm/services/finans.service";
import type {
  CrmFinansAlacakFiltre,
  CrmFinansCariFiltre,
  CrmSatisTahsilatRow,
  CrmTahsilatGuncelleParams,
  CrmTahsilatKaydetParams,
  CrmTahsilatListeFiltre,
  DbId,
} from "@/modules/crm/types/finans";

export const CRM_SATIS_TAHSILAT_QUERY_KEY = "crm-satis-tahsilat";
export const CRM_FINANS_ALACAK_QUERY_KEY = "crm-finans-alacak";
export const CRM_FINANS_CARI_QUERY_KEY = "crm-finans-cari";
export const CRM_FINANS_OZET_QUERY_KEY = "crm-finans-ozet";
export const CRM_TAHSILAT_LIST_QUERY_KEY = "crm-tahsilat-list";
export const CRM_TAHSILAT_DETAY_QUERY_KEY = "crm-tahsilat-detay";

/**
 * Finans tarafının tüm sorguları. Hepsi satış verisinden de etkilenir
 * (alacak = satış toplamı − tahsilat); satış mutasyonları bu listeyi
 * invalidate eder (use-satis.ts).
 */
export const CRM_FINANS_QUERY_KEYS = [
  CRM_SATIS_TAHSILAT_QUERY_KEY,
  CRM_FINANS_ALACAK_QUERY_KEY,
  CRM_FINANS_CARI_QUERY_KEY,
  CRM_FINANS_OZET_QUERY_KEY,
  CRM_TAHSILAT_LIST_QUERY_KEY,
  CRM_TAHSILAT_DETAY_QUERY_KEY,
] as const;

/* ------------------------------------------------------------------ */
/* Sorgular — Satışlar sekmesi                                         */
/* ------------------------------------------------------------------ */

// Modül seviyesinde: select referansı sabit kalsın, harita her render'da yeniden kurulmasın.
const tahsilatHaritasi = (rows: CrmSatisTahsilatRow[]) =>
  new Map(rows.map((r) => [String(r.IDCrmSatis), r]));

/**
 * Ödeme rozeti için satış başına net tahsilat, IDCrmSatis (string) → satır.
 * Haritada olmayan satışın tahsilatı yoktur (TahsilEdilen = 0).
 */
export function useCrmSatisTahsilatlari(enabled = true) {
  return useQuery({
    queryKey: [CRM_SATIS_TAHSILAT_QUERY_KEY],
    queryFn: () => finansService.satisTahsilatList(),
    select: tahsilatHaritasi,
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Ödeme bilgileri alınamadı." },
  });
}

/* ------------------------------------------------------------------ */
/* Sorgular — Finans sekmesi                                           */
/* ------------------------------------------------------------------ */

/** Alacaklar. SadeceAcik varsayılan true. IDCrmKisi boş → tüm müşteriler. */
export function useCrmFinansAlacaklar(filtre: CrmFinansAlacakFiltre = {}, enabled = true) {
  const IDCrmKisi = filtre.IDCrmKisi ?? null;
  const OdemeDurumu = filtre.OdemeDurumu ?? null;
  const SadeceAcik = filtre.SadeceAcik ?? true;

  return useQuery({
    queryKey: [CRM_FINANS_ALACAK_QUERY_KEY, String(IDCrmKisi ?? ""), OdemeDurumu, SadeceAcik],
    queryFn: () => finansService.alacakList({ IDCrmKisi, OdemeDurumu, SadeceAcik }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Alacak listesi alınamadı." },
  });
}

/** Müşteri bakiyeleri. SadeceBakiyeli varsayılan false. */
export function useCrmFinansCari(filtre: CrmFinansCariFiltre = {}, enabled = true) {
  const SadeceBakiyeli = filtre.SadeceBakiyeli ?? false;

  return useQuery({
    queryKey: [CRM_FINANS_CARI_QUERY_KEY, SadeceBakiyeli],
    queryFn: () => finansService.cariList({ SadeceBakiyeli }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Müşteri bakiyeleri alınamadı." },
  });
}

/** Özet kartlar. */
export function useCrmFinansOzet(enabled = true) {
  return useQuery({
    queryKey: [CRM_FINANS_OZET_QUERY_KEY],
    queryFn: () => finansService.ozet(),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Finans özeti alınamadı." },
  });
}

/* ------------------------------------------------------------------ */
/* Sorgular — Tahsilat                                                 */
/* ------------------------------------------------------------------ */

/** Tahsilat / iade listesi. Boş filtre → hepsi. */
export function useCrmTahsilatlar(filtre: CrmTahsilatListeFiltre = {}, enabled = true) {
  const IDCrmSatis = filtre.IDCrmSatis ?? null;
  const IDCrmKisi = filtre.IDCrmKisi ?? null;
  const Baslangic = filtre.Baslangic ?? null;
  const Bitis = filtre.Bitis ?? null;
  const Tip = filtre.Tip ?? null;

  return useQuery({
    queryKey: [
      CRM_TAHSILAT_LIST_QUERY_KEY,
      String(IDCrmSatis ?? ""),
      String(IDCrmKisi ?? ""),
      Baslangic,
      Bitis,
      Tip,
    ],
    queryFn: () => finansService.tahsilatList({ IDCrmSatis, IDCrmKisi, Baslangic, Bitis, Tip }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Tahsilat listesi alınamadı." },
  });
}

export function useCrmTahsilatDetay(IDCrmTahsilat: DbId | null | undefined) {
  return useQuery({
    queryKey: [CRM_TAHSILAT_DETAY_QUERY_KEY, String(IDCrmTahsilat)],
    queryFn: () => finansService.tahsilatDetay(IDCrmTahsilat!),
    enabled: IDCrmTahsilat != null && IDCrmTahsilat !== "",
    meta: { hataMesaji: "Tahsilat bilgileri alınamadı." },
  });
}

/* ------------------------------------------------------------------ */
/* Mutasyonlar                                                         */
/* ------------------------------------------------------------------ */

/**
 * Tahsilat değişince tüm finans sorguları tazelenir. Satış listesi
 * etkilenmez (satış para tutmaz; rozet CRM_SATIS_TAHSILAT'tan gelir).
 * Tahsilat girişi kişiye aktivite yazar; aktivite listesi de yenilenir.
 */
function useCrmTahsilatYenile() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [...CRM_FINANS_QUERY_KEYS, CRM_AKTIVITE_LIST_QUERY_KEY]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

/** Döner: { IDCrmTahsilat }. Satış formundaki "Ödeme alındı" da bunu kullanır. */
export function useInsertCrmTahsilat() {
  const yenile = useCrmTahsilatYenile();
  return useMutation({
    mutationFn: (params: CrmTahsilatKaydetParams) => finansService.tahsilatInsert(params),
    onSuccess: yenile,
  });
}

export function useUpdateCrmTahsilat() {
  const yenile = useCrmTahsilatYenile();
  return useMutation({
    mutationFn: (params: CrmTahsilatGuncelleParams) => finansService.tahsilatUpdate(params),
    onSuccess: yenile,
  });
}

export function useDeleteCrmTahsilat() {
  const yenile = useCrmTahsilatYenile();
  return useMutation({
    mutationFn: (IDCrmTahsilat: DbId) => finansService.tahsilatDelete(IDCrmTahsilat),
    onSuccess: yenile,
  });
}
