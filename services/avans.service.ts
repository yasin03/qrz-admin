import api from "@/lib/axios";
import {
  AvansDeleteParams,
  AvansInsertParams,
  AvansSelectParams,
  AvansTalepInsertParams,
  AvansTalepSelectParams,
  AvansTalepType,
  AvansTalepUpdateParams,
  AvansType,
} from "@/types/avans";

const AVANS_ENDPOINT = "/api/avans";

export const avansService = {
  select: async (params: AvansSelectParams): Promise<AvansType[]> => {
    const { data } = await api.post(AVANS_ENDPOINT, {
      type: "SELECT_AVANS",
      ...params,
    });
    return data ?? [];
  },

  insert: async (params: AvansInsertParams) => {
    const { data } = await api.post(AVANS_ENDPOINT, {
      type: "INSERT_AVANS",
      ...params,
    });
    return data;
  },

  delete: async (params: AvansDeleteParams) => {
    const { data } = await api.post(AVANS_ENDPOINT, {
      type: "DELETE_AVANS",
      ...params,
    });
    return data;
  },

  selectTalep: async (
    params: AvansTalepSelectParams,
  ): Promise<AvansTalepType[]> => {
    const { data } = await api.post(AVANS_ENDPOINT, {
      type: "SELECT_TALEP",
      ...params,
    });
    return data ?? [];
  },

  insertTalep: async (params: AvansTalepInsertParams) => {
    const { data } = await api.post(AVANS_ENDPOINT, {
      type: "INSERT_TALEP",
      ...params,
    });
    return data;
  },

  updateTalep: async (params: AvansTalepUpdateParams) => {
    const { data } = await api.post(AVANS_ENDPOINT, {
      type: "UPDATE_TALEP",
      ...params,
    });
    return data;
  },
};
