import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { katsayiService } from "@/services/katsayi.service";
import { KatsayiUpdateRequestType } from "@/types/ayarlar/katsayi";

export const KATSAYI_QUERY_KEY = "katsayi-list";

/** Şirketin seçilen yıla ait katsayıları (IDSirket session'dan). */
export function useKatsayiList(Yil: string, enabled = true) {
  return useQuery({
    queryKey: [KATSAYI_QUERY_KEY, Yil],
    queryFn: () => katsayiService.select({ Yil }),
    enabled: enabled && Boolean(Yil),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
}

export function useUpdateKatsayi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: KatsayiUpdateRequestType) =>
      katsayiService.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KATSAYI_QUERY_KEY] });
    },
  });
}
