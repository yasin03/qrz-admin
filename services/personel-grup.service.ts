import api from "@/lib/axios";
import {
  PersonelGrupDeleteRequestType,
  PersonelGrupInsertRequestType,
  PersonelGrupResponseType,
  PersonelGrupType,
  PersonelGrupUpdateRequestType,
} from "@/types/ayarlar/personel-grup";

const PERSONEL_GRUP_ENDPOINT = "/api/ayarlar/per-grup";

export const personelGrupService = {
  select: async (): Promise<PersonelGrupType[]> => {
    const { data } = await api.post(PERSONEL_GRUP_ENDPOINT, {
      type: "SELECT_PERGRUP",
    });
    return data ?? [];
  },

  insert: async (
    params: PersonelGrupInsertRequestType,
  ): Promise<PersonelGrupResponseType | undefined> => {
    const { data } = await api.post(PERSONEL_GRUP_ENDPOINT, {
      type: "INSERT_PERGRUP",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  update: async (
    params: PersonelGrupUpdateRequestType,
  ): Promise<PersonelGrupResponseType | undefined> => {
    const { data } = await api.post(PERSONEL_GRUP_ENDPOINT, {
      type: "UPDATE_PERGRUP",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  delete: async (
    params: PersonelGrupDeleteRequestType,
  ): Promise<PersonelGrupResponseType | undefined> => {
    const { data } = await api.post(PERSONEL_GRUP_ENDPOINT, {
      type: "DELETE_PERGRUP",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },
};
