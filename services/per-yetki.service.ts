import api from "@/lib/axios";
import {
  PerYetkiResponseType,
  PerYetkiType,
  PerYetkiUpdateRequestType,
} from "@/types/ayarlar/per-yetki";

const PER_YETKI_ENDPOINT = "/api/ayarlar/per-yetki";

export const perYetkiService = {
  select: async (): Promise<PerYetkiType | null> => {
    const { data } = await api.post(PER_YETKI_ENDPOINT, {
      type: "SELECT_PERYETKI",
    });
    return (Array.isArray(data) ? data[0] : data) ?? null;
  },

  update: async (
    params: PerYetkiUpdateRequestType,
  ): Promise<PerYetkiResponseType | undefined> => {
    const { data } = await api.post(PER_YETKI_ENDPOINT, {
      type: "UPDATE_PERYETKI",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },
};
