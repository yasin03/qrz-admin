import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type WorkingContext = {
  IDGurup?: string | number | null;
  IDSirket: string | number;
  IDSube?: string | number | null;
  Yil: string;
  Ay?: string | null;
};

async function fetchContext(): Promise<WorkingContext | null> {
  const response = await fetch("/api/context");
  if (!response.ok) return null;

  const data = await response.json();
  return data.context ?? null;
}

async function saveContextRequest(payload: WorkingContext) {
  const response = await fetch("/api/context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Bölüm bilgileri kaydedilemedi.");
  }

  return response.json();
}

export const contextKeys = {
  current: ["genel", "context"] as const,
};

// Mevcut çalışma bağlamını okur (grsisudo cookie'sinin decrypt edilmiş
// hâli). staleTime: Infinity — bu değer sadece useSaveContext başarıyla
// çalışınca değişir, otomatik bayatlayıp yeniden çekilmesine gerek yok.
export function useCurrentContext() {
  return useQuery({
    queryKey: contextKeys.current,
    queryFn: fetchContext,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSaveContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveContextRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextKeys.current });
    },
  });
}
