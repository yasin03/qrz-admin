import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CRM_AKTIVITE_LIST_QUERY_KEY,
  CRM_KISI_LIST_QUERY_KEY,
  useCrmKisiler,
} from "@/modules/crm/hooks/use-kisiler";
import { kisiAdi } from "@/modules/crm/lib/kisiler";
import { teklifService } from "@/modules/crm/services/teklif.service";
import type {
  DbId,
  TeklifAlanlari,
  TeklifGuncelleParams,
  TeklifKabulParams,
  TeklifListeFiltre,
  TeklifRedParams,
} from "@/modules/crm/types/teklif";

export const CRM_TEKLIF_LIST_QUERY_KEY = "crm-teklif-list";
export const CRM_TEKLIF_DETAY_QUERY_KEY = "crm-teklif-detay";
export const CRM_TEKLIF_REVIZYON_QUERY_KEY = "crm-teklif-revizyon";

/* ------------------------------------------------------------------ */
/* Sorgular                                                            */
/* ------------------------------------------------------------------ */

/** Teklif listesi. IDCrmKisi boş → şirketin tüm teklifleri. */
export function useTeklifler(filtre: TeklifListeFiltre = {}, enabled = true) {
  const IDCrmKisi = filtre.IDCrmKisi ?? null;
  const Durum = filtre.Durum ?? null;
  const SadeceGuncel = filtre.SadeceGuncel ?? true;

  return useQuery({
    queryKey: [CRM_TEKLIF_LIST_QUERY_KEY, String(IDCrmKisi ?? ""), Durum, SadeceGuncel],
    queryFn: () => teklifService.list({ IDCrmKisi, Durum, SadeceGuncel }),
    enabled,
    staleTime: 60 * 1000,
    meta: { hataMesaji: "Teklif listesi alınamadı." },
  });
}

/** Başlık + kalemler. */
export function useTeklifDetay(IDCrmTeklif: DbId | null | undefined) {
  return useQuery({
    queryKey: [CRM_TEKLIF_DETAY_QUERY_KEY, String(IDCrmTeklif)],
    queryFn: () => teklifService.detay(IDCrmTeklif!),
    enabled: IDCrmTeklif != null && IDCrmTeklif !== "",
    meta: { hataMesaji: "Teklif bilgileri alınamadı." },
  });
}

/** Bir teklifin tüm sürümleri. */
export function useTeklifRevizyonlari(TeklifNo: string | null | undefined) {
  return useQuery({
    queryKey: [CRM_TEKLIF_REVIZYON_QUERY_KEY, TeklifNo],
    queryFn: () => teklifService.revizyonlar(TeklifNo!),
    enabled: !!TeklifNo,
  });
}

/**
 * Teklif formundaki kişi seçimi: kontaklar + müşteriler (zaten cache'te
 * olan kişi listeleri). FormSearchSelect'in `useOptions` hook'u olarak
 * kullanılır; arama yerel yapılır.
 */
export function useTeklifKisiSecenekleri(search: string) {
  const kontak = useCrmKisiler("Kontak");
  const musteri = useCrmKisiler("Musteri");

  const tumu = useMemo(
    () =>
      [...(musteri.data ?? []), ...(kontak.data ?? [])].map((k) => ({
        value: String(k.IDCrmKisi),
        label: `${kisiAdi(k)}${k.Tip === "Kontak" ? " (Kontak)" : ""}`,
      })),
    [kontak.data, musteri.data],
  );

  const options = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return q ? tumu.filter((o) => o.label.toLocaleLowerCase("tr").includes(q)) : tumu;
  }, [tumu, search]);

  return { options, isLoading: kontak.isLoading || musteri.isLoading };
}

/** Formda seçili kişinin kaydı (PDF önizleme için; cache'teki listelerden). */
export function useTeklifKisi(IDCrmKisi: string | null | undefined, enabled = true) {
  const { data: kontaklar } = useCrmKisiler("Kontak", enabled);
  const { data: musteriler } = useCrmKisiler("Musteri", enabled);
  return useMemo(() => {
    if (!IDCrmKisi) return null;
    const bul = (liste: typeof kontaklar) => liste?.find((k) => String(k.IDCrmKisi) === IDCrmKisi);
    return bul(musteriler) ?? bul(kontaklar) ?? null;
  }, [IDCrmKisi, kontaklar, musteriler]);
}

/* ------------------------------------------------------------------ */
/* Mutasyonlar                                                         */
/* ------------------------------------------------------------------ */

/**
 * Teklif değişince teklif sorguları tazelenir. Gönder / kabul / red
 * kişiye aktivite kaydı ekler, kabul kontağı müşteriye dönüştürür; bu
 * yüzden kişi ve aktivite listeleri de yenilenir.
 */
function useTeklifYenile() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of [
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

export function useInsertTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (params: TeklifAlanlari) => teklifService.insert(params),
    onSuccess: yenile,
  });
}

export function useUpdateTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (params: TeklifGuncelleParams) => teklifService.update(params),
    onSuccess: yenile,
  });
}

export function useGonderTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (IDCrmTeklif: DbId) => teklifService.gonder(IDCrmTeklif),
    onSuccess: yenile,
  });
}

export function useKabulTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (params: TeklifKabulParams) => teklifService.kabul(params),
    onSuccess: yenile,
  });
}

export function useRedTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (params: TeklifRedParams) => teklifService.red(params),
    onSuccess: yenile,
  });
}

export function useIptalTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (IDCrmTeklif: DbId) => teklifService.iptal(IDCrmTeklif),
    onSuccess: yenile,
  });
}

export function useIptalGeriAlTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (IDCrmTeklif: DbId) => teklifService.iptalGeriAl(IDCrmTeklif),
    onSuccess: yenile,
  });
}

/** Döner: yeni sürümün IDCrmTeklif'i. */
export function useRevizyonTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (IDCrmTeklif: DbId) => teklifService.revizyon(IDCrmTeklif),
    onSuccess: yenile,
  });
}

export function useDeleteTeklif() {
  const yenile = useTeklifYenile();
  return useMutation({
    mutationFn: (IDCrmTeklif: DbId) => teklifService.delete(IDCrmTeklif),
    onSuccess: yenile,
  });
}
