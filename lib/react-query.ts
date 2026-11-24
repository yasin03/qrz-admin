import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Hata veren sorgu, aynı veriyi kullanan başka bir bileşen ekrana gelince
      // kendiliğinden tekrar istenmez (yoksa sekme/dialog açtıkça istek birikir).
      // Tekrar deneme kullanıcıya bırakılır ("Tekrar dene" / sayfa yenileme).
      retryOnMount: false,
      refetchOnWindowFocus: false,
    },
    // Mutation'lar otomatik tekrar denenmesin (çift INSERT riski)
    mutations: {
      retry: 0,
    },
  },
});
