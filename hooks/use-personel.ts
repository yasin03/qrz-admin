import { DeletePersonelRequest } from "@/types/personel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---- API çağrısı --------------------------------------------------------

async function callPersonelApi<T>(
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/personel", {
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

// ---- Tipler -----------------------------------------------------------

export type DurumFiltre = "" | "AKTİF" | "PASİF" | "YENİ";

export type PersonelFilters = {
  IDSube: string | number;
  IDBolum: string | number | "";
  DurumTarihi: string; // "yyyy-MM-dd"
  Durum: DurumFiltre;
};

// ---- Query key factory ----------------------------------------------

export const personelKeys = {
  all: ["personel"] as const,
  list: (filters: PersonelFilters | null) =>
    [...personelKeys.all, "list", filters] as const,
  detay: (id: string | number | undefined) =>
    [...personelKeys.all, "detay", id ?? ""] as const,
};

// ---- Personel Listesi ----------------------------------------------------
// filters null/eksikken (henüz şube seçilmemişse) hiç sorgu atmıyor.
// Filtre değiştiğinde queryKey değişip React Query otomatik yeniden fetch
// ediyor — elle useEffect/fetch yazmaya gerek yok.

export function usePersonelListesi(filters: PersonelFilters | null) {
  return useQuery({
    queryKey: personelKeys.list(filters),
    queryFn: () =>
      callPersonelApi<unknown>({
        type: "GET_PERSONEL",
        IDSube: filters!.IDSube,
        IDBolum: filters!.IDBolum,
        DurumTarihi: filters!.DurumTarihi,
        Durum: filters!.Durum,
      }),
    enabled: Boolean(filters?.IDSube),
    select: (data) => normalizeListResponse<any>(data),
  });
}

// ---- Personel Detay ----------------------------------------------------
// id verilmediyse (modal kapalıyken) hiç sorgu atmıyor. Tek kayıt bekleniyor
// -> normalizeListResponse'un ilk elemanını döndürüyoruz (obje, dizi değil).

export function usePersonelDetay(id: string | number | undefined) {
  return useQuery({
    queryKey: personelKeys.detay(id),
    queryFn: () =>
      callPersonelApi<unknown>({
        type: "GET_PERSONEL_DETAY",
        IDSubePersonel: id,
      }),
    enabled: Boolean(id),
    select: (data) => normalizeListResponse<any>(data)[0],
  });
}

export function useDeletePersonel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeletePersonelRequest) =>
      callPersonelApi({
        type: "DELETE_PERSONEL",
        IDSubePersonel: payload.IDSubePersonel,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: personelKeys.detay(variables.IDSubePersonel),
      });
    },
  });
}
