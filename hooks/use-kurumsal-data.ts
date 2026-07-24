import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/auth-store";
import {
  CreateGrupRequest,
  DeleteGrupRequest,
  GrupType,
  UpdateGrupRequest,
} from "@/types/kurumsal/grup";
import { ApiListResponse } from "@/types/api";
import { SirketType } from "@/types/kurumsal/sirket";
import { SubeType } from "@/types/kurumsal/sube";

interface UseSirketlerOptions {
  enabled?: boolean;
}

interface UseSubelerOptions {
  enabled?: boolean;
}

// ============================================================================
// API ÇAĞRISI — tek endpoint, "type" ile hangi stored procedure çalışacağını
// server tarafında ayırt ediyoruz (projendeki /api/aGm/aRapor mantığının aynısı).
// Endpoint yolunu ve CRUD type isimlerini kendi backend'ine göre düzenle —
// GET_* olanlar sende verdiğin SP'lerle eşleşiyor, ADD/UPDATE/DELETE olanlar
// SP isimlerini vermediğin için TODO placeholder.
// ============================================================================

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
  subeler: (idSirket: number) =>
    [...kurumsalKeys.all, "subeler", idSirket] as const,
};

// ============================================================================
// SEVİYE 1 — GRUPLAR
// Sayfa açılır açılmaz çekilir, her zaman enabled.
// ============================================================================

export function useGruplar() {
  return useQuery({
    queryKey: kurumsalKeys.gruplar(),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<GrupType>>("/api/kurumsal", {
        type: "GETGRUPLAR",
      }),

    select: (data) => normalizeListResponse(data),
  });
}

// ============================================================================
// SEVİYE 2 — ŞİRKETLER
// Sadece bir grup satırı genişletildiğinde (enabled: true) çekilir.
// Her satır kendi useSirketler(idGurup) çağrısını yapar — normal ve doğru
// bir React Query kullanımı, "N ayrı hook çağrısı" gibi durmasın diye
// endişelenme, her satır zaten ayrı bir component instance'ı.
// ============================================================================

export function useSirketler(idGurup: number, options?: UseSirketlerOptions) {
  return useQuery({
    queryKey: kurumsalKeys.sirketler(idGurup),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<SirketType>>("/api/kurumsal", {
        type: "GETSIRKETLER",
        IDGurup: idGurup,
      }),

    enabled: !!idGurup && (options?.enabled ?? true),

    select: (data) => normalizeListResponse(data),
  });
}

// ============================================================================
// SEVİYE 3 — ŞUBELER
// Aynı mantık, bir şirket satırı genişletildiğinde çekilir.
// ============================================================================

export function useSubeler(idSirket: number, options?: UseSubelerOptions) {
  return useQuery({
    queryKey: kurumsalKeys.subeler(idSirket),

    queryFn: () =>
      callKurumsalApi<ApiListResponse<SubeType>>("/api/kurumsal", {
        type: "GETSUBELER",
        IDSirket: idSirket,
      }),

    enabled: !!idSirket && (options?.enabled ?? true),

    select: (data) => normalizeListResponse(data),
  });
}

// ============================================================================
// CRUD MUTASYONLARI
// Her biri başarı sonrası SADECE ilgili seviyenin cache'ini invalidate eder —
// bu yüzden bir şirket eklediğinde tüm sayfa değil, sadece o grubun şirket
// gridi yeniden fetch edilir.
//
// TODO: "ADD_GRUP" / "UPDATE_GRUP" vb. type isimlerini kendi backend'indeki
// gerçek stored procedure isimleriyle eşleştir (bana vermedin, placeholder).
// ============================================================================

// ---- Grup ----

export function useCreateGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGrupRequest) =>
      callKurumsalApi("/api/kurumsal/grup", {
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
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: (payload: UpdateGrupRequest) =>
      callKurumsalApi("/api/kurumsal/grup", {
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
    mutationFn: (idGurup: DeleteGrupRequest) =>
      callKurumsalApi("/api/kurumsal/grup", {
        type: "DELETE_GRUP",
        IDGurup: idGurup,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.gruplar(),
      });
    },
  });
}

// ---- Şirket ----
/* 
export function useCreateSirket() {
  const queryClient = useQueryClient();
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: (payload) =>
      callKurumsalApi({
        type: "ADD_SIRKET",
        IDKullanici: idKullanici,
        ...payload, // { IDGurup, ...diğer alanlar }
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(idKullanici, variables.IDGurup),
      });
    },
  });
}

export function useUpdateSirket() {
  const queryClient = useQueryClient();
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: (payload) =>
      callKurumsalApi({
        type: "UPDATE_SIRKET",
        IDKullanici: idKullanici,
        ...payload, // { IDSirket, IDGurup, ...diğer alanlar }
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(idKullanici, variables.IDGurup),
      });
    },
  });
}

export function useDeleteSirket() {
  const queryClient = useQueryClient();
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: ({ IDSirket }) =>
      callKurumsalApi({
        type: "DELETE_SIRKET",
        IDKullanici: idKullanici,
        IDSirket,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.sirketler(idKullanici, variables.IDGurup),
      });
    },
  });
}

// ---- Şube ----

export function useCreateSube() {
  const queryClient = useQueryClient();
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: (payload) =>
      callKurumsalApi({
        type: "ADD_SUBE",
        IDKullanici: idKullanici,
        ...payload, // { IDSirket, ...diğer alanlar }
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(idKullanici, variables.IDSirket),
      });
    },
  });
}

export function useUpdateSube() {
  const queryClient = useQueryClient();
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: (payload) =>
      callKurumsalApi({
        type: "UPDATE_SUBE",
        IDKullanici: idKullanici,
        ...payload, // { IDSube, IDSirket, ...diğer alanlar }
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(idKullanici, variables.IDSirket),
      });
    },
  });
}

export function useDeleteSube() {
  const queryClient = useQueryClient();
  const idKullanici = useAuthStore((state) => state.user?.IDKullanici);

  return useMutation({
    mutationFn: ({ IDSube }) =>
      callKurumsalApi({
        type: "DELETE_SUBE",
        IDKullanici: idKullanici,
        IDSube,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kurumsalKeys.subeler(idKullanici, variables.IDSirket),
      });
    },
  });
} */

// ============================================================================
// BUNDLE HOOK — sayfanın en üstünde tek satırla grup listesi + tüm CRUD
// mutasyonlarına erişim. Şirket/şube listeleri (lazy oldukları için) ayrı
// ayrı useSirketler(idGurup) / useSubeler(idSirket) ile, satır bazında
// kullanılıyor (aşağıdaki örnek component'e bak).
// ============================================================================

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

    /*     createSirket: useCreateSirket(),
    updateSirket: useUpdateSirket(),
    deleteSirket: useDeleteSirket(),

    createSube: useCreateSube(),
    updateSube: useUpdateSube(),
    deleteSube: useDeleteSube(), */
  };
}
