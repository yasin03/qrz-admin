import api from "@/lib/axios";
import {
  EklentiDeleteRequestType,
  EklentiInsertRequestType,
  EklentiInsertResponseType,
  EklentiResponseType,
  EklentiSelectRequestType,
  EklentiUpdateRequestType,
  EklentiUpdateResponseType,
  KesintiDeleteRequestType,
  KesintiInsertRequestType,
  KesintiInsertResponseType,
  KesintiResponseType,
  KesintiSelectRequestType,
  KesintiUpdateRequestType,
  KesintiUpdateResponseType,
} from "@/types/bordro-parametre";

const BORDRO_PARAMETRE_ENDPOINT = "/api/bordro/parametre";

export const bordroParametreService = {
  selectEklenti: async (
    params: EklentiSelectRequestType,
  ): Promise<EklentiResponseType[]> => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "SELECT_EKLENTI",
      ...params,
    });
    return data ?? [];
  },

  insertEklenti: async (
    params: EklentiInsertRequestType,
  ): Promise<EklentiInsertResponseType | undefined> => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "INSERT_EKLENTI",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  updateEklenti: async (
    params: EklentiUpdateRequestType,
  ): Promise<EklentiUpdateResponseType | undefined> => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "UPDATE_EKLENTI",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  deleteEklenti: async (params: EklentiDeleteRequestType) => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "DELETE_EKLENTI",
      ...params,
    });
    return data;
  },

  // ---- Kesinti ----------------------------------------------------------

  selectKesinti: async (
    params: KesintiSelectRequestType,
  ): Promise<KesintiResponseType[]> => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "SELECT_KESINTI",
      ...params,
    });
    return data ?? [];
  },

  insertKesinti: async (
    params: KesintiInsertRequestType,
  ): Promise<KesintiInsertResponseType | undefined> => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "INSERT_KESINTI",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  updateKesinti: async (
    params: KesintiUpdateRequestType,
  ): Promise<KesintiUpdateResponseType | undefined> => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "UPDATE_KESINTI",
      ...params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  deleteKesinti: async (params: KesintiDeleteRequestType) => {
    const { data } = await api.post(BORDRO_PARAMETRE_ENDPOINT, {
      type: "DELETE_KESINTI",
      ...params,
    });
    return data;
  },
};
