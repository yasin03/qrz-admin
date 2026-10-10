import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  AktifPasifGrupRequest,
  CreateGrupRequest,
  DeleteGrupRequest,
  GrupType,
} from "@/types/kurumsal/grup";
import { ApiListResponse } from "@/types/api";
import {
  CreateSirketRequest,
  SirketType,
  UpdateSirketRequest,
} from "@/types/kurumsal/sirket";
import {
  CreateSubeRequest,
  SubeType,
  UpdateSubeRequest,
} from "@/types/kurumsal/sube";
import {
  BolumType,
  CreateBolumRequest,
  DeleteBolumRequest,
  UpdateBolumRequest,
} from "@/types/kurumsal/bolum";

interface UseSirketlerOptions {
  enabled?: boolean;
}

interface UseSubelerOptions {
  enabled?: boolean;
}

interface UseBolumlerOptions {
  enabled?: boolean;
}

async function callKurumsalApi<T>(
  url: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("İşlem başarısız oldu.");
  }

  return response.json();
}

/**
 * Ekle/güncelle/sil gibi işlemler için. Stored procedure'ler iş kuralı
 * hatalarında HTTP 200 ile `{ test: 0, sonuc: "<hata mesajı>" }` dönüyor
 * (örn. "Aynı Vergi numarası ile daha önce oluşturulmuş..").
 * Bunu hata olarak fırlatıyoruz ki mutation onError'a düşsün, onSuccess
 * (ve "başarılı" toast'ı) çalışmasın. `test` alanı dönmeyen
 * procedure'ler için davranış değişmiyor.
 */
async function callKurumsalMutation<T>(
  url: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const data = await callKurumsalApi<T>(url, payload);

  const result = (Array.isArray(data) ? data[0] : data) as
    | { test?: unknown; sonuc?: string }
    | undefined;

  if (result && typeof result === "object" && Number(result.test) === 0) {
    throw new Error(result.sonuc || "İşlem başarısız oldu.");
  }

  return data;
}

function normalizeListResponse<T>(data: ApiListResponse<T>): T[] {
  if (!Array.isArray(data)) {
    return [];
  }

  if (data.length === 0) {
    return [];
  }

  const first = data[0];
  return Array.isArray(first) ? first : (data as T[]);
}

// ============================================================================
// QUERY KEY FACTORY — tüm cache anahtarları tek yerde, invalidate ederken
// yanlış key yazma riskini ortadan kaldırır.
// ============================================================================

export const kurumsalKeys = {
  all: ["kurumsal"] as const,

  gruplar: () => [...kurumsalKeys.all, "gruplar"] as const,
  sirketler: (idGurup: number) =>
    [...kurumsalKeys.all, "sirketler", idGurup] as const,
  sirketDetay: (idSirket: number) =>
    [...kurumsalKeys.all, "sirketDetay", idSirket] as const,
  subeler: (idSirket: number) =>
    [...kurumsalKeys.all, "subeler", idSirket] as const,
  subeDetay: (idSube: number) =>
    [...kurumsalKeys.all, "subeDetay", idSube] as const,
  bolumler: (idSube: number) =>
    [...kurumsalKeys.all, "bolumler", idSube] as const,
  bolumDetay: (idBolum: number) =>
    [...kurumsalKeys.all, "bolumDetay", idBolum] as const,
};

// ============================================================================
// SEVİYE 1 — GRUPLAR
// ============================================================================

export function useGruplar() {
  return useQuery({
    queryKey: kurumsalKeys.gruplar(),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<GrupType>>("/api/kurumsal/grup", {
        type: "GET_GRUPLAR",
      }),

    select: (data) => normalizeListResponse(data),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useCreateGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGrupRequest) =>
      callKurumsalMutation("/api/kurumsal/grup", {
        type: "ADD_GRUP",
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.gruplar(),
      });
    },
  });
}

export function useUpdateGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGrupRequest) =>
      callKurumsalMutation("/api/kurumsal/grup", {
        type: "UPDATE_GRUP",
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.gruplar(),
      });
    },
  });
}

export function useDeleteGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteGrupRequest) =>
      callKurumsalMutation("/api/kurumsal/grup", {
        type: "DELETE_GRUP",
        IDGurup: payload.IDGurup,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.gruplar(),
      });
    },
  });
}

export function useAktifPasifGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AktifPasifGrupRequest) =>
      callKurumsalMutation("/api/kurumsal/grup", {
        type: "AKTIFPASIF_GRUP",
        IDGurup: payload.IDGurup,
        Durum: payload.Durum,
      }),
    onSuccess: () => {
      // API grubu pasife alınca altındaki şirket/şube/bölümleri de pasife
      // alıyor — bu yüzden sadece grup listesini değil, tüm kurumsal
      // cache'i geçersiz kılıyoruz (açık olan tüm gridler yeniden çekilir).
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.all,
      });
    },
  });
}

// ============================================================================
// SEVİYE 2 — ŞİRKETLER
// ============================================================================

export function useSirketler(idGurup: number, options?: UseSirketlerOptions) {
  return useQuery({
    queryKey: kurumsalKeys.sirketler(idGurup),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<SirketType>>("/api/kurumsal/sirket", {
        type: "GET_SIRKETLER",
        IDGurup: idGurup,
      }),

    enabled: !!idGurup && (options?.enabled ?? true),
    select: (data) => normalizeListResponse(data),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useSirketDetay(idSirket: number) {
  return useQuery({
    queryKey: kurumsalKeys.sirketDetay(idSirket),
    queryFn: () =>
      callKurumsalApi<ApiListResponse<SirketType>>("/api/kurumsal/sirket", {
        type: "GET_SIRKET_DETAY",
        IDSirket: idSirket,
      }),
    enabled: !!idSirket,
    select: (data) => normalizeListResponse(data)[0] as SirketType | undefined,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useCreateSirket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Omit<
        CreateSirketRequest,
        "IDSirket" | "IDFirma" | "IDKullanici"
      >,
    ) =>
      callKurumsalMutation("/api/kurumsal/sirket", {
        type: "ADD_SIRKET",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(variables.IDGurup),
      });
    },
  });
}

export function useUpdateSirket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Omit<UpdateSirketRequest, "IDFirma" | "IDKullanici">,
    ) =>
      callKurumsalMutation("/api/kurumsal/sirket", {
        type: "UPDATE_SIRKET",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(variables.IDGurup),
      });
    },
  });
}

export function useDeleteSirket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { IDSirket: number; IDGurup: number }) =>
      callKurumsalMutation("/api/kurumsal/sirket", {
        type: "DELETE_SIRKET",
        IDSirket: payload.IDSirket,
      }),
    onSuccess: (_data, variables) => {
      // Sadece bu şirketin ait olduğu grubun şirket listesini geçersiz kıl
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(variables.IDGurup),
      });
    },
  });
}

export function useAktifPasifSirket() {
  const queryClient = useQueryClient();

  return useMutation({
    /** Durum: şirketin YENİ durumu (1 = aktif, 0 = pasif) */
    mutationFn: (payload: { IDSirket: number; IDGurup: number; Durum: 0 | 1 }) =>
      callKurumsalMutation("/api/kurumsal/sirket", {
        type: "AKTIFPASIF_SIRKET",
        IDSirket: payload.IDSirket,
        Durum: payload.Durum,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(variables.IDGurup),
      });
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketDetay(variables.IDSirket),
      });
      // API şirketi pasife alınca altındaki şubeleri (ve onların
      // bölümlerini) de pasife alıyor — o gridler de yeniden çekilsin.
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(variables.IDSirket),
      });
      queryClient.invalidateQueries({
        queryKey: [...kurumsalKeys.all, "subeDetay"],
      });
      queryClient.invalidateQueries({
        queryKey: [...kurumsalKeys.all, "bolumler"],
      });
      queryClient.invalidateQueries({
        queryKey: [...kurumsalKeys.all, "bolumDetay"],
      });
    },
  });
}

// ============================================================================
// SEVİYE 3 — ŞUBELER
// ============================================================================

export function useSubeler(idSirket: number, options?: UseSubelerOptions) {
  return useQuery({
    queryKey: kurumsalKeys.subeler(idSirket),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<SubeType>>("/api/kurumsal/sube", {
        type: "GET_SUBELER",
        IDSirket: idSirket,
      }),

    enabled: !!idSirket && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 dakika
    select: (data) => normalizeListResponse(data),
  });
}

export function useSubeDetay(idSube: number) {
  return useQuery({
    queryKey: kurumsalKeys.subeDetay(idSube),
    queryFn: () =>
      callKurumsalApi<ApiListResponse<SubeType>>("/api/kurumsal/sube", {
        type: "GET_SUBE_DETAY",
        IDSube: idSube,
      }),
    enabled: !!idSube,
    staleTime: 5 * 60 * 1000, // 5 dakika
    select: (data) => normalizeListResponse(data)[0] as SubeType | undefined,
  });
}

export function useCreateSube() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateSubeRequest, "IDKullanici">) =>
      callKurumsalMutation("/api/kurumsal/sube", {
        type: "ADD_SUBE",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(variables.IDSirket),
      });
    },
  });
}

export function useUpdateSube() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<UpdateSubeRequest, "IDKullanici">) =>
      callKurumsalMutation("/api/kurumsal/sube", {
        type: "UPDATE_SUBE",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(variables.IDSirket),
      });
    },
  });
}

export function useDeleteSube() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { IDSube: number; IDSirket: number }) =>
      callKurumsalMutation("/api/kurumsal/sube", {
        type: "DELETE_SUBE",
        IDSube: payload.IDSube,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(variables.IDSirket),
      });
    },
  });
}

export function useAktifPasifSube() {
  const queryClient = useQueryClient();

  return useMutation({
    /** Durum: şubenin YENİ durumu (1 = aktif, 0 = pasif) */
    mutationFn: (payload: { IDSube: number; IDSirket: number; Durum: 0 | 1 }) =>
      callKurumsalMutation("/api/kurumsal/sube", {
        type: "AKTIFPASIF_SUBE",
        IDSube: payload.IDSube,
        Durum: payload.Durum,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(variables.IDSirket),
      });
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeDetay(variables.IDSube),
      });
    },
  });
}

// ============================================================================
// SEVİYE 3 — BÖLÜMLER
// ============================================================================

export function useBolumler(idSube: number, options?: UseBolumlerOptions) {
  return useQuery({
    queryKey: kurumsalKeys.bolumler(idSube),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<BolumType>>("/api/kurumsal/bolum", {
        type: "GET_BOLUMLER",
        IDSube: idSube,
      }),

    enabled: !!idSube && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 dakika
    select: (data) => normalizeListResponse(data),
  });
}

export function useCreateBolum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBolumRequest) =>
      callKurumsalMutation("/api/kurumsal/bolum", {
        type: "ADD_BOLUM",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.bolumler(variables.IDSube),
      });
    },
  });
}

export function useUpdateBolum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBolumRequest) =>
      callKurumsalMutation("/api/kurumsal/bolum", {
        type: "UPDATE_BOLUM",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.bolumler(variables.IDSube),
      });
    },
  });
}

export function useDeleteBolum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteBolumRequest) =>
      callKurumsalMutation("/api/kurumsal/bolum", {
        type: "DELETE_BOLUM",
        IDBolum: payload.IDBolum,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.bolumler(variables.IDSube),
      });
    },
  });
}

export function useKurumsalData() {
  const gruplarQuery = useGruplar();

  return {
    gruplar: gruplarQuery.data ?? [],
    isLoadingGruplar: gruplarQuery.isLoading,
    isErrorGruplar: gruplarQuery.isError,
    refetchGruplar: gruplarQuery.refetch,

    createGrup: useCreateGrup(),
    updateGrup: useUpdateGrup(),
    deleteGrup: useDeleteGrup(),
  };
}
