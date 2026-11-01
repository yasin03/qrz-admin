import api from "@/lib/axios";
import {
  IzinLimitDeleteRequestType,
  IzinLimitInsertRequestType,
  IzinLimitResponseType,
  IzinLimitType,
  IzinLimitUpdateRequestType,
  TatilDeleteRequestType,
  TatilInsertRequestType,
  TatilResponseType,
  TatilSelectRequestType,
  TatilType,
  TatilUpdateRequestType,
} from "@/types/sistem/sgk-bordro";

const SGK_BORDRO_ENDPOINT = "/api/sistem/sgk-bordro";

export const sgkBordroService = {
  tatilSelect: async (params: TatilSelectRequestType): Promise<TatilType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_TATIL",
      params,
    });
    return data ?? [];
  },

  tatilInsert: async (
    params: TatilInsertRequestType,
  ): Promise<TatilResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_TATIL",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  tatilUpdate: async (
    params: TatilUpdateRequestType,
  ): Promise<TatilResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_TATIL",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  tatilDelete: async (
    params: TatilDeleteRequestType,
  ): Promise<TatilResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_TATIL",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  // Adi filtresi kullanılmıyor, proc'a boş gidiyor.
  izinLimitSelect: async (): Promise<IzinLimitType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_IZINLIMIT",
      params: { Adi: "" },
    });
    return data ?? [];
  },

  izinLimitInsert: async (
    params: IzinLimitInsertRequestType,
  ): Promise<IzinLimitResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_IZINLIMIT",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  izinLimitUpdate: async (
    params: IzinLimitUpdateRequestType,
  ): Promise<IzinLimitResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_IZINLIMIT",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  izinLimitDelete: async (
    params: IzinLimitDeleteRequestType,
  ): Promise<IzinLimitResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_IZINLIMIT",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },
};
