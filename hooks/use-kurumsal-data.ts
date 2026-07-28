import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/auth-store";
import {
  CreateGrupRequest,
  DeleteGrupRequest,
  GrupType,
  UpdateGrupRequest,
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

interface UseSirketlerOptions {
  enabled?: boolean;
}

interface UseSubelerOptions {
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
  });
}

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

  return useMutation({
    mutationFn: (payload: CreateGrupRequest) =>
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
    mutationFn: (payload: DeleteGrupRequest) =>
      callKurumsalApi("/api/kurumsal/grup", {
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
      callKurumsalApi("/api/kurumsal/sirket", {
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
      callKurumsalApi("/api/kurumsal/sirket", {
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
      callKurumsalApi("/api/kurumsal/sirket", {
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
    select: (data) => normalizeListResponse(data)[0] as SubeType | undefined,
  });
}

export function useCreateSube() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateSubeRequest, "IDKullanici">) =>
      callKurumsalApi("/api/kurumsal/sube", {
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
      callKurumsalApi("/api/kurumsal/sube", {
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
      callKurumsalApi("/api/kurumsal/sube", {
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
