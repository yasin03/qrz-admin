import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { perYetkiService } from "@/services/per-yetki.service";
import { PerYetkiUpdateRequestType } from "@/types/ayarlar/per-yetki";
import { PerYetkiKey } from "@/lib/per-yetki";
import { useRole } from "@/stores/auth-store";

export const PER_YETKI_QUERY_KEY = "per-yetki";

/** Şirketin personel yetki ayarları (IDSirket session'dan). */
export function usePerYetki(enabled = true) {
  return useQuery({
    queryKey: [PER_YETKI_QUERY_KEY],
    queryFn: () => perYetkiService.select(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

/**
 * Personel rolü için sayfa yetkilerini döner. Admin/Yönetici için sorgu
 * atılmaz ve her yetki true kabul edilir.
 *
 *   const { can, isLoading } = usePersonelYetki();
 *   if (!can("PersonelPdksGorur")) ...
 */
export function usePersonelYetki() {
  const { isPersonel } = useRole();
  const { data, isLoading } = usePerYetki(isPersonel);

  const can = (key: PerYetkiKey) => !isPersonel || Boolean(data?.[key]);

  return { can, isLoading: isPersonel && isLoading };
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
