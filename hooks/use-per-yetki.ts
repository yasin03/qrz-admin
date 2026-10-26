import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { perYetkiService } from "@/services/per-yetki.service";
import { PerYetkiUpdateRequestType } from "@/types/ayarlar/per-yetki";

export const PER_YETKI_QUERY_KEY = "per-yetki";

/** Şirketin personel yetki ayarları (IDSirket session'dan). */
export function usePerYetki() {
  return useQuery({
    queryKey: [PER_YETKI_QUERY_KEY],
    queryFn: () => perYetkiService.select(),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useUpdatePerYetki() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: PerYetkiUpdateRequestType) =>
      perYetkiService.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PER_YETKI_QUERY_KEY] });
    },
  });
}
