import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AJANDA_DETAY_QUERY_KEY,
  AJANDA_HATIRLATMA_QUERY_KEY,
  AJANDA_LIST_QUERY_KEY,
} from "@/modules/core/hooks/use-ajanda";
import { useIller } from "@/modules/core/hooks/use-il-ilce-vergi-data";
import { kisilerService } from "@/modules/crm/services/kisiler.service";
import type {
  CrmAktiviteGuncelleParams,
  CrmAktiviteKaydetParams,
  CrmAktiviteListeFiltre,
  CrmAktiviteTamamlaParams,
  CrmKisiGuncelleParams,
  CrmKisiKaydetParams,
  CrmKisiTip,
  CrmYaklasanFiltre,
  DbId,
} from "@/modules/crm/types/kisiler";

export const CRM_KISI_LIST_QUERY_KEY = "crm-kisi-list";
export const CRM_AKTIVITE_LIST_QUERY_KEY = "crm-aktivite-list";
export const CRM_YAKLASAN_QUERY_KEY = "crm-aktivite-yaklasan";
export const CRM_AKTIVITE_AJANDA_QUERY_KEY = "crm-aktivite-ajanda";

/* ------------------------------------------------------------------ */
/* Sorgular                                                            */
/* ------------------------------------------------------------------ */

/** Şirketin kontakları (Tip = 'Kontak') veya müşterileri (Tip = 'Musteri'). */
export function useCrmKisiler(Tip: CrmKisiTip, enabled = true) {
  return useQuery({
    queryKey: [CRM_KISI_LIST_QUERY_KEY, Tip],
    queryFn: () => kisilerService.kisiList(Tip),
    enabled,
    staleTime: 60 * 1000, // 1 dakika
    meta: { hataMesaji: "Kişi listesi alınamadı." },
  });
}

/** Zaman çizelgesi. IDCrmKisi boş → şirketin tüm aktiviteleri. */
export function useCrmAktiviteler(filtre: CrmAktiviteListeFiltre = {}, enabled = true) {
  const IDCrmKisi = filtre.IDCrmKisi ?? null;
  const Durum = filtre.Durum ?? null;

  return useQuery({
    queryKey: [CRM_AKTIVITE_LIST_QUERY_KEY, String(IDCrmKisi ?? ""), Durum],
    queryFn: () => kisilerService.aktiviteList({ IDCrmKisi, Durum }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Görüşmeler alınamadı." },
  });
}

/** Yaklaşan + gecikmiş randevular (dashboard / "bugün ne var"). */
export function useCrmYaklasan(filtre: CrmYaklasanFiltre = {}, enabled = true) {
  const Gun = filtre.Gun ?? 7;
  const Benim = Boolean(filtre.Benim);

  return useQuery({
    queryKey: [CRM_YAKLASAN_QUERY_KEY, Gun, Benim],
    queryFn: () => kisilerService.yaklasan({ Gun, Benim }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Yaklaşan randevular alınamadı." },
  });
}

/**
 * İl kodu ("034") → il adı. İller tüm uygulamada tek sefer çekilip
 * süresiz cache'lenir (useIller), ek istek atılmaz.
 */
export function useIlAdi() {
  const { data: iller = [] } = useIller();
  const harita = useMemo(() => new Map(iller.map((il) => [il.IlKodu, il.IlAdi])), [iller]);
  return useCallback((kod: string | null | undefined) => (kod ? (harita.get(kod) ?? kod) : null), [harita]);
}

/** Takvimdeki kaydın bağlı olduğu CRM aktivitesi (yoksa null). */
export function useCrmAktiviteByAjanda(IDAjanda: DbId | null | undefined) {
  return useQuery({
    queryKey: [CRM_AKTIVITE_AJANDA_QUERY_KEY, String(IDAjanda)],
    queryFn: () => kisilerService.aktiviteByAjanda(IDAjanda!),
    enabled: IDAjanda != null && IDAjanda !== "",
  });
}

/* ------------------------------------------------------------------ */
/* Mutasyonlar                                                         */
/* ------------------------------------------------------------------ */

/**
 * CRM verisi değişince kişi ve aktivite listeleri tazelenir. Kişi
 * listesindeki sayaçlar (GorusmeSayisi vb.) aktivitelerden hesaplandığı için
 * aktivite değişikliğinde de kişi listesi yenilenir.
 * Randevular takvime bağlı olduğundan ajanda sorguları da tazelenir.
 */
function useCrmYenile() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
      CRM_KISI_LIST_QUERY_KEY,
      CRM_AKTIVITE_LIST_QUERY_KEY,
      CRM_YAKLASAN_QUERY_KEY,
      CRM_AKTIVITE_AJANDA_QUERY_KEY,
      AJANDA_LIST_QUERY_KEY,
      AJANDA_DETAY_QUERY_KEY,
      AJANDA_HATIRLATMA_QUERY_KEY,
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

/* ---------------- Kişi ---------------- */

export function useInsertCrmKisi() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmKisiKaydetParams) => kisilerService.kisiInsert(params),
    onSuccess: yenile,
  });
}

export function useUpdateCrmKisi() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmKisiGuncelleParams) => kisilerService.kisiUpdate(params),
    onSuccess: yenile,
  });
}

/** Kontak → Müşteri. */
export function useMusteriyeDonustur() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmKisi: DbId) => kisilerService.musteriyeDonustur(IDCrmKisi),
    onSuccess: yenile,
  });
}

/** Kişiyi aktiviteleriyle siler (bağlı takvim kayıtları da kalkar). */
/**
 * Silmede kişinin satışları da silinir ve teklif bağları çözülür; pasife
 * almada finans bakiyelerindeki kişi durumu değişir. Bu yüzden tüm CRM
 * sorguları ("crm-" ile başlayan key'ler) tazelenir. use-satis / use-finans
 * key'leri import edilmez: onlar bu dosyayı import ediyor (döngü olmasın).
 */
export function useDeleteCrmKisi() {
  const yenile = useCrmYenile();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (IDCrmKisi: DbId) => kisilerService.kisiDelete(IDCrmKisi),
    onSuccess: () => {
      yenile();
      queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("crm-") });
    },
  });
}

/* ---------------- Aktivite ---------------- */

/** Durum 1 → görüşme, 0 → randevu (takvime düşer). */
export function useInsertCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmAktiviteKaydetParams) => kisilerService.aktiviteInsert(params),
    onSuccess: yenile,
  });
}

export function useUpdateCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmAktiviteGuncelleParams) => kisilerService.aktiviteUpdate(params),
    onSuccess: yenile,
  });
}

/** Randevu → görüşme. */
export function useTamamlaCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmAktiviteTamamlaParams) => kisilerService.aktiviteTamamla(params),
    onSuccess: yenile,
  });
}

/** Randevuyu iptal eder (takvimden kalkar). */
export function useIptalCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmAktivite: DbId) => kisilerService.aktiviteIptal(IDCrmAktivite),
    onSuccess: yenile,
  });
}

export function useDeleteCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmAktivite: DbId) => kisilerService.aktiviteDelete(IDCrmAktivite),
    onSuccess: yenile,
  });
}
