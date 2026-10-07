"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { PersonelDashboard, YoneticiDashboard } from "@/types/dashboard";

const ENDPOINT = "/api/dashboard";

// Personelin kendi özeti. Personel ID'si sunucuda oturumdan alınır.
export function usePersonelDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "personel"],
    queryFn: async () => {
      const { data } = await api.post<PersonelDashboard>(ENDPOINT, {
        type: "PERSONEL_OZET",
      });
      return data;
    },
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

// Yönetici / admin: seçili şube ve dönemin özeti
export function useYoneticiDashboard(
  params: {
    IDSube: string | number | null | undefined;
    Yil: string;
    Ay: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ["dashboard", "yonetici", params.IDSube, params.Yil, params.Ay],
    queryFn: async () => {
      const { data } = await api.post<YoneticiDashboard>(ENDPOINT, {
        type: "YONETICI_OZET",
        ...params,
      });
      return data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: enabled && Boolean(params.IDSube),
  });
}
