import {
  LokasyonDeleteType,
  LokasyonFilters,
  LokasyonInsertType,
  LokasyonUpdateType,
} from "@/types/lokasyon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---- API çağrısı --------------------------------------------------------

async function callLokasyonApi<T>(
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/lokasyon", {
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

// ---- Query key factory ----------------------------------------------
export const lokasyonKeys = {
  all: ["lokasyon"] as const,
  list: (filters: LokasyonFilters | null) =>
    [...lokasyonKeys.all, "list", filters] as const,
  detay: (id: string | number | undefined) =>
    [...lokasyonKeys.all, "detay", id ?? ""] as const,
};

// ---- Lokasyon Listesi ----------------------------------------------------
export function useLokasyonList(filters: LokasyonFilters | null) {
  return useQuery({
    queryKey: lokasyonKeys.list(filters),
    queryFn: () =>
      callLokasyonApi<unknown>({
        type: "SELECT_LOKASYON",
        IDBolum: filters!.IDBolum || "0",
      }),
    select: (data) => normalizeListResponse<any>(data),
  });
}

// ---- Lokasyon Delete ----------------------------------------------------
export function useDeleteLokasyon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LokasyonDeleteType) =>
      callLokasyonApi({
        type: "DELETE_LOKASYON",
        IDBolumLokasyon: payload.IDBolumLokasyon,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: lokasyonKeys.detay(variables.IDBolumLokasyon),
      });
    },
  });
}

// ---- Ekleme / Güncelleme ------------------------------------------------
export function useCreateLokasyon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LokasyonInsertType) =>
      callLokasyonApi({
        type: "INSERT_LOKASYON",
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lokasyonKeys.all });
    },
  });
}

export function useUpdateLokasyon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LokasyonUpdateType) =>
      callLokasyonApi({
        type: "UPDATE_LOKASYON",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: lokasyonKeys.all });
      queryClient.invalidateQueries({
        queryKey: lokasyonKeys.detay(variables.IDBolumLokasyon),
      });
    },
  });
}
