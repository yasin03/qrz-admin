import axiosInstance from "@/lib/axios";
import {
  IzinType,
  IzinSelectParams,
  IzinDeleteParams,
  IzinInsertParams,
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
};
