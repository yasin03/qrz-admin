import { useQuery } from "@tanstack/react-query";

// ---- Tipler -----------------------------------------------------------

export type IlType = {
  IlAdi: string;
  IlKodu: string;
};

export type IlceType = {
  IlAdi: string; // ilçenin kendi adı (API'de böyle geliyor, IlceAdi değil)
  IlKodu: string;
  IlceKodu: string;
};

export type VergiDairesiType = {
  IDVergiDairesi: string;
  DaireAdi: string;
};

// ---- API çağrısı --------------------------------------------------------

async function callGenelApi<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/genel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("İşlem başarısız oldu.");
  }

  return response.json();
}

function normalizeListResponse<T>(data: unknown): T[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  return Array.isArray(first) ? (first as T[]) : (data as T[]);
}

/**
 * Aynı "değer" alanına sahip birden fazla kayıt varsa (örn. iki farklı
 * IDVergiDairesi, aynı DaireAdi metnine sahip) ilkini tutup diğerlerini
 * eler. Select'in değeri zaten sadece bu alan (isim/kod) olduğu için, aynı
 * değeri üreten kayıtlar seçim açısından ayırt edilemez — tekrarları elemek
 * veri kaybı değil, React/Radix'in "unique key/value" gereksinimini
 * karşılamanın doğru yolu. (Bu düzeltme olmadan "Encountered two children
 * with the same key" hatası ve Radix Select'te belirsiz seçim oluşuyordu.)
 */
function dedupeBy<T>(items: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// ---- Query key factory ----------------------------------------------

export const genelKeys = {
  all: ["genel"] as const,
  iller: (idUlke: string) => [...genelKeys.all, "iller", idUlke] as const,
  ilceler: (ilKodu: string) => [...genelKeys.all, "ilceler", ilKodu] as const,
  vergiDaireleri: (ilKodu: string) =>
    [...genelKeys.all, "vergiDaireleri", ilKodu] as const,
};

const TURKIYE_ID_ULKE = "38";

// ---- İller ----------------------------------------------------------
// Ülke değişmiyor (hep Türkiye), tüm uygulamada TEK bir network isteği
// yeterli — staleTime: Infinity ile React Query bunu bir daha hiç
// otomatik yeniden çekmiyor (pencereye odaklanma, remount vb. tetiklemiyor).

export function useIller(idUlke: string = TURKIYE_ID_ULKE) {
  return useQuery({
    queryKey: genelKeys.iller(idUlke),
    queryFn: () =>
      callGenelApi<unknown>({ type: "GET_ILLER", IDUlke: idUlke }),
    select: (data) => dedupeBy(normalizeListResponse<IlType>(data), "IlKodu"),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ---- İlçeler ----------------------------------------------------------
// Seçili il olmadan sorgu atmıyor (enabled). İl değişince query key
// değişiyor, React Query otomatik yeni ile ait ilçeleri çekiyor —
// daha önce bakılmış bir ile geri dönülürse cache'ten anında gelir.

export function useIlceler(ilKodu?: string) {
  return useQuery({
    queryKey: genelKeys.ilceler(ilKodu ?? ""),
    queryFn: () =>
      callGenelApi<unknown>({ type: "GET_ILCELER", IlKodu: ilKodu }),
    enabled: Boolean(ilKodu),
    select: (data) =>
      dedupeBy(normalizeListResponse<IlceType>(data), "IlceKodu"),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ---- Vergi Daireleri ----------------------------------------------------
// ilKodu verilmezse (veya boşsa) "0" gönderiyoruz -> API tüm vergi
// dairelerini döndürüyor (senin belirttiğin kural).

export function useVergiDaireleri(ilKodu?: string) {
  const effectiveIlKodu = ilKodu && ilKodu !== "" ? ilKodu : "0";

  return useQuery({
    queryKey: genelKeys.vergiDaireleri(effectiveIlKodu),
    queryFn: () =>
      callGenelApi<unknown>({
        type: "GET_VERGIDAIRELERI",
        IlKodu: effectiveIlKodu,
      }),
    select: (data) =>
      dedupeBy(normalizeListResponse<VergiDairesiType>(data), "DaireAdi"),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}