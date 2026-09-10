import axiosInstance from "@/lib/axios";
import {
  IzinType,
  IzinSelectParams,
  IzinDeleteParams,
  IzinInsertParams,
  IzinTalepSelectParams,
  IzinTalepType,
  IzinSureType,
  IzinTalepInsertParams,
  IzinSureParams,
  IzinTalepUpdateParams,
} from "@/types/izin";

const IZIN_ENDPOINT = "/api/izin";

export const izinService = {
  select: async (params: IzinSelectParams): Promise<IzinType[]> => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "SELECT_IZIN",
      ...params,
    });
    return data ?? [];
  },

  insert: async (params: IzinInsertParams) => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "INSERT_IZIN",
      ...params,
    });
    return data;
  },

  delete: async (params: IzinDeleteParams) => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "DELETE_IZIN",
      ...params,
    });
    return data;
  },

  selectTalep: async (
    params: IzinTalepSelectParams,
  ): Promise<IzinTalepType[]> => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "SELECT_TALEP",
      ...params,
    });
    return data ?? [];
  },

  insertTalep: async (params: IzinTalepInsertParams) => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "INSERT_TALEP",
      ...params,
    });
    return data;
  },

  updateTalep: async (params: IzinTalepUpdateParams) => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "UPDATE_TALEP",
      ...params,
    });
    return data;
  },

  getIzinSure: async (params: IzinSureParams): Promise<IzinSureType | null> => {
    const { data } = await axiosInstance.post(IZIN_ENDPOINT, {
      type: "GET_IZINSURE",
      ...params,
    });
    // SP tek satır dönüyorsa dizi olarak gelebilir, ilk elemanı normalize ediyoruz.
    return Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  },
};
