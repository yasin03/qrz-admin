import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    // Mutation'lar otomatik tekrar denenmesin (çift INSERT riski)
    mutations: {
      retry: 0,
    },
  },
});
