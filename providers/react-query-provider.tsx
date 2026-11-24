"use client";

import { MutationCache, QueryCache, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiClientError } from "@/lib/axios";

interface Props {
  children: ReactNode;
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /**
       * false verilirse bu işlem dashboard önbelleğini geçersiz kılmaz
       * (veri değiştirmeyen, sadece okuma yapan mutation'lar için).
       */
      dashboardYenile?: boolean;
    };
    queryMeta: {
      /**
       * Sorgu (tekrar denemeler dahil) başarısız olunca gösterilecek toast
       * mesajı. Verilmezse genel mesaj gösterilir; false verilirse toast
       * gösterilmez (arka planda çalışan kontrol sorguları için).
       * Aynı mesaj üst üste birikmez, tek toast olarak kalır.
       */
      hataMesaji?: string | false;
    };
  }
}

const GENEL_HATA_MESAJI = "Veriler alınamadı. Lütfen tekrar deneyin.";

/** Sorgu hatası → toast. Oturum düşmüşse (401) uyarı gösterilmez. */
function sorguHatasiBildir(error: unknown, hataMesaji: string | false | undefined) {
  if (hataMesaji === false) return;
  const hata = error as ApiClientError;
  if (hata?.status === 401) return;

  const mesaj = hataMesaji || GENEL_HATA_MESAJI;
  // 4xx: sunucunun Türkçe açıklaması (ör. "Lütfen önce üstten şirket seçimi yapın.")
  // alt satırda gösterilir. 5xx / bağlantı hatasında teknik detay gösterilmez.
  const aciklama =
    hata?.status && hata.status >= 400 && hata.status < 500 ? hata.message : undefined;

  toast.error(mesaj, { id: mesaj, description: aciklama });
}

export default function ReactQueryProvider({ children }: Props) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      // Sorgu son deneme de başarısız olunca kullanıcıya toast ile bildirilir
      // (her deneme için değil, bir kez). Mesaj meta.hataMesaji ile özelleştirilir.
      queryCache: new QueryCache({
        onError: (error, query) => sorguHatasiBildir(error, query.meta?.hataMesaji),
      }),
      // Dashboard izin, avans, PDKS, bordro, personel… verilerinin özetini gösterir.
      // Herhangi bir kaydet/güncelle/onayla/sil başarılı olunca dashboard önbelleği
      // eskimiş sayılır; dashboard'a dönüldüğünde güncel veri çekilir. Böylece her
      // hook'a ayrı ayrı ["dashboard"] invalidate'i eklemek gerekmez.
      mutationCache: new MutationCache({
        onSuccess: (_data, _variables, _context, mutation) => {
          if (mutation.meta?.dashboardYenile === false) return;
          client.invalidateQueries({ queryKey: ["dashboard"] });
        },
      }),
      defaultOptions: {
        queries: {
          retry: 1,
          // Hata veren sorgu, aynı veriyi kullanan başka bir bileşen ekrana gelince
          // kendiliğinden tekrar istenmez (yoksa sekme/dialog açtıkça istek birikir).
          // Tekrar deneme kullanıcıya bırakılır ("Tekrar dene" / sayfa yenileme).
          retryOnMount: false,
          refetchOnWindowFocus: false,
        },
        // Kaydet/güncelle/sil hata verince otomatik tekrar denenmesin: INSERT gibi
        // işlemler ikinci kez çalışıp çift kayıt oluşturabiliyordu.
        mutations: {
          retry: 0,
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
