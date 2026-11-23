import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AJANDA_DETAY_QUERY_KEY,
  AJANDA_HATIRLATMA_QUERY_KEY,
  AJANDA_LIST_QUERY_KEY,
} from "@/modules/core/hooks/use-ajanda";
import { useIller } from "@/modules/core/hooks/use-il-ilce-vergi-data";
import { crmService } from "@/modules/crm/services/crm.service";
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
} from "@/modules/crm/types/crm";

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
    queryFn: () => crmService.kisiList(Tip),
    enabled,
    staleTime: 60 * 1000, // 1 dakika
  });
}

/** Zaman çizelgesi. IDCrmKisi boş → şirketin tüm aktiviteleri. */
export function useCrmAktiviteler(filtre: CrmAktiviteListeFiltre = {}, enabled = true) {
  const IDCrmKisi = filtre.IDCrmKisi ?? null;
  const Durum = filtre.Durum ?? null;

  return useQuery({
    queryKey: [CRM_AKTIVITE_LIST_QUERY_KEY, String(IDCrmKisi ?? ""), Durum],
    queryFn: () => crmService.aktiviteList({ IDCrmKisi, Durum }),
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Yaklaşan + gecikmiş randevular (dashboard / "bugün ne var"). */
export function useCrmYaklasan(filtre: CrmYaklasanFiltre = {}, enabled = true) {
  const Gun = filtre.Gun ?? 7;
  const Benim = Boolean(filtre.Benim);

  return useQuery({
    queryKey: [CRM_YAKLASAN_QUERY_KEY, Gun, Benim],
    queryFn: () => crmService.yaklasan({ Gun, Benim }),
    enabled,
    staleTime: 60 * 1000,
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
    queryFn: () => crmService.aktiviteByAjanda(IDAjanda!),
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
    mutationFn: (params: CrmKisiKaydetParams) => crmService.kisiInsert(params),
    onSuccess: yenile,
  });
}

export function useUpdateCrmKisi() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmKisiGuncelleParams) => crmService.kisiUpdate(params),
    onSuccess: yenile,
  });
}

/** Kontak → Müşteri. */
export function useMusteriyeDonustur() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmKisi: DbId) => crmService.musteriyeDonustur(IDCrmKisi),
    onSuccess: yenile,
  });
}

/** Kişiyi aktiviteleriyle siler (bağlı takvim kayıtları da kalkar). */
export function useDeleteCrmKisi() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmKisi: DbId) => crmService.kisiDelete(IDCrmKisi),
    onSuccess: yenile,
  });
}

/* ---------------- Aktivite ---------------- */

/** Durum 1 → görüşme, 0 → randevu (takvime düşer). */
export function useInsertCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmAktiviteKaydetParams) => crmService.aktiviteInsert(params),
    onSuccess: yenile,
  });
}

export function useUpdateCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmAktiviteGuncelleParams) => crmService.aktiviteUpdate(params),
    onSuccess: yenile,
  });
}

/** Randevu → görüşme. */
export function useTamamlaCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (params: CrmAktiviteTamamlaParams) => crmService.aktiviteTamamla(params),
    onSuccess: yenile,
  });
}

/** Randevuyu iptal eder (takvimden kalkar). */
export function useIptalCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmAktivite: DbId) => crmService.aktiviteIptal(IDCrmAktivite),
    onSuccess: yenile,
  });
}

export function useDeleteCrmAktivite() {
  const yenile = useCrmYenile();
  return useMutation({
    mutationFn: (IDCrmAktivite: DbId) => crmService.aktiviteDelete(IDCrmAktivite),
    onSuccess: yenile,
  });
}
