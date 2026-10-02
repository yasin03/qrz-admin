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
  UcretTipi?: "" | "BRÜT" | "NET";
  Cinsiyet?: "" | "KADIN" | "ERKEK";
  MedeniDurum?: "" | "BEKAR" | "EVLİ";
  CalismaDurumu?: "" | "ÇALISIYOR" | "ÇALIŞMIYOR";
};

export type PersonelSgkIslemType =
  | "SGK_GIRIS"
  | "MANUEL_GIRIS"
  | "SGK_CIKIS"
  | "MANUEL_CIKIS";

export type PersonelSgkIslemPayload = {
  type: PersonelSgkIslemType;
  IDSubePersonel: string;
  GirisTarihi?: string;
  CikisTarihi?: string;
  PersonelAyrilisKodu?: string;
};

export type PersonelSettingsPayload = {
  IDSubePersonel: string;
  Telefon: string;
  Sifre: string;
  KullaniciAktif: boolean;
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
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useAktifPersonelListesi() {
  return useQuery({
    queryKey: personelKeys.all,
    queryFn: () =>
      callPersonelApi<unknown>({
        type: "GET_AKTIF_PERSONEL",
        TcKimlikNo: "",
        Adi: "",
      }),
    select: (data) => normalizeListResponse<any>(data),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

// ---- Personel Detay ----------------------------------------------------

export function usePersonelDetay(id?: string | number | undefined) {
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

// ---- Ekleme / Güncelleme ------------------------------------------------

export function useCreatePersonel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      callPersonelApi({
        type: "INSERT_PERSONEL",
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personelKeys.all });
    },
  });
}

export function useUpdatePersonel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: Record<string, unknown> & { IDSubePersonel: string | number },
    ) =>
      callPersonelApi({
        type: "UPDATE_PERSONEL",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: personelKeys.all });
      queryClient.invalidateQueries({
        queryKey: personelKeys.detay(variables.IDSubePersonel),
      });
    },
  });
}

export type PersonelSettingsResult = {
  test: number;
  sonuc: string;
};

export function useUpdatePersonelSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PersonelSettingsPayload) =>
      callPersonelApi<PersonelSettingsResult[]>({
        type: "UPDATE_PERSONEL_SETTINGS",
        ...payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: personelKeys.all });
      queryClient.invalidateQueries({
        queryKey: personelKeys.detay(variables.IDSubePersonel),
      });
    },
  });
}

export function usePersonelSgkIslem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PersonelSgkIslemPayload) => {
      const response = await fetch("/api/personel/sgk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "SGK işlemi başarısız oldu.");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personelKeys.all });
    },
  });
}

// ---- Excel İçe Aktarma --------------------------------------------------
// Her satır API'ye tek tek gönderilir; SP sonucu test:1 başarılı, test:0
// başarısız sayılır. Bir satırın hata alması diğerlerini durdurmaz.

export type PersonelImportRow = Record<
  string,
  string | number | boolean | null
>;

export type PersonelImportFailure = {
  row: PersonelImportRow;
  message: string;
};

export type PersonelImportSummary = {
  total: number;
  success: number;
  failed: number;
  failures: PersonelImportFailure[];
};

type PersonelImportVariables = {
  rows: PersonelImportRow[];
  onProgress?: (done: number, total: number) => void;
};

async function importPersonelRow(row: PersonelImportRow) {
  // Şirket/kullanıcı bilgisi session'dan gelir, Excel'deki değerler gönderilmez.
  const personel = { ...row };
  delete personel.IDKullanici;
  delete personel.IDSirket;

  const response = await fetch("/api/personel/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "IMPORT_EXCEL", ...personel }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "İstek başarısız oldu.");
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (Number(result?.test) !== 1) {
    throw new Error(result?.sonuc || "Kayıt eklenemedi.");
  }
}

export function useImportPersonel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rows,
      onProgress,
    }: PersonelImportVariables): Promise<PersonelImportSummary> => {
      const failures: PersonelImportFailure[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          await importPersonelRow(rows[i]);
        } catch (error) {
          failures.push({
            row: rows[i],
            message: error instanceof Error ? error.message : String(error),
          });
        }
        onProgress?.(i + 1, rows.length);
      }

      return {
        total: rows.length,
        success: rows.length - failures.length,
        failed: failures.length,
        failures,
      };
    },
    onSuccess: (summary) => {
      if (summary.success > 0) {
        queryClient.invalidateQueries({ queryKey: personelKeys.all });
      }
    },
  });
}
