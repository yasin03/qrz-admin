import api from "@/lib/axios";
import {
  KatsayiResponseType,
  KatsayiSelectRequestType,
  KatsayiType,
  KatsayiUpdateRequestType,
} from "@/types/ayarlar/katsayi";

const KATSAYI_ENDPOINT = "/api/ayarlar/katsayilar";

export const katsayiService = {
  select: async (params: KatsayiSelectRequestType): Promise<KatsayiType[]> => {
    const { data } = await api.post(KATSAYI_ENDPOINT, {
      type: "SELECT_KATSAYILAR",
      params,
    });
    return data ?? [];
  },

  update: async (
    params: KatsayiUpdateRequestType,
  ): Promise<KatsayiResponseType | undefined> => {
    const { data } = await api.post(KATSAYI_ENDPOINT, {
      type: "UPDATE_KATSAYI",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },
};
