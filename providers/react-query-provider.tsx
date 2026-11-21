"use client";

import { MutationCache, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { QueryClient } from "@tanstack/react-query";

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
  }
}

export default function ReactQueryProvider({ children }: Props) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
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
