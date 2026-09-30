import {
  DeleteKullaniciRequestType,
  DeleteKullaniciYetkiRequestType,
  InsertKullaniciRequestType,
  InsertKullaniciYetkiRequestType,
  SelectKullaniciYetkiResponseType,
  SelectKullaniciResponseType,
  UpdateKullaniciRequestType,
} from "@/types/kullanici";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---- API çağrısı --------------------------------------------------------

async function callKullaniciApi<T>(
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/kullanici", {
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

export const kullaniciKeys = {
  all: ["kullanici"] as const,
  list: () => [...kullaniciKeys.all, "list"] as const,
  yetki: (id: string | number | undefined) =>
    [...kullaniciKeys.all, "yetki", id ?? ""] as const,
};

// ---- Kullanıcı Listesi --------------------------------------------------

export function useKullaniciList(enabled = true) {
  return useQuery({
    queryKey: kullaniciKeys.list(),
    queryFn: () => callKullaniciApi<unknown>({ type: "SELECT_KULLANICI" }),
    select: (data) => normalizeListResponse<SelectKullaniciResponseType>(data),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

// ---- Ekleme / Güncelleme / Silme ----------------------------------------

export function useCreateKullanici() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InsertKullaniciRequestType) =>
      callKullaniciApi({
        type: "INSERT_KULLANICI",
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kullaniciKeys.all });
    },
  });
}

// Güncelleme/silmede IDKullanici, işlem yapılan kullanıcının ID'si —
export function useUpdateKullanici() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateKullaniciRequestType) =>
      callKullaniciApi({
        type: "UPDATE_KULLANICI",
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kullaniciKeys.all });
    },
  });
}

export function useDeleteKullanici() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteKullaniciRequestType) =>
      callKullaniciApi({
        type: "DELETE_KULLANICI",
        IDKullanici: payload.IDKullanici,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kullaniciKeys.all });
    },
  });
}

// ---- Kullanıcı Yetki Alanları -------------------------------------------
// Burada IDKullanici, yetkileri listelenen kullanıcının ID'si — route'taki
// `...payload` session değerini eziyor.

export function useKullaniciYetkiList(
  idKullanici?: string | number,
  enabled = true,
) {
  return useQuery({
    queryKey: kullaniciKeys.yetki(idKullanici),
    queryFn: () =>
      callKullaniciApi<unknown>({
        type: "SELECT_KULLANICI_YETKI",
        IDKullanici: idKullanici,
      }),
    select: (data) =>
      normalizeListResponse<SelectKullaniciYetkiResponseType>(data),
    enabled: enabled && Boolean(idKullanici),
  });
}

export function useCreateKullaniciYetki() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InsertKullaniciYetkiRequestType) =>
      callKullaniciApi({
        type: "INSERT_KULLANICI_YETKI",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kullaniciKeys.yetki(variables.IDKullanici),
      });
    },
  });
}

// Silme IDKullaniciAlan ile yapılıyor; listeyi yenilemek için hangi
// kullanıcıya ait olduğunu da alıyoruz (API'ye gönderilmiyor).
export function useDeleteKullaniciYetki() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: DeleteKullaniciYetkiRequestType & {
        IDKullanici: string | number;
      },
    ) =>
      callKullaniciApi({
        type: "DELETE_KULLANICI_YETKI",
        IDKullaniciAlan: payload.IDKullaniciAlan,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: kullaniciKeys.yetki(variables.IDKullanici),
      });
    },
  });
}
