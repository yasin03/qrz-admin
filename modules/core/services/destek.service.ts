import api from "@/lib/axios";
import {
  DestekKonuType,
  DestekTalepDeleteRequestType,
  DestekMesajInsertRequestType,
  DestekMesajType,
  DestekTalepDurumRequestType,
  DestekTalepInsertRequestType,
  DestekTalepResponseType,
  DestekTalepType,
} from "@/modules/core/types/destek";

const DESTEK_ENDPOINT = "/api/destek";

export const destekService = {
  // IDSirket route'ta session'dan set ediliyor (admin → "0" / tüm talepler).
  destekTalepSelect: async (): Promise<DestekTalepType[]> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "SELECT_DESTEKTALEP",
      params: {},
    });
    return data ?? [];
  },

  destekKonuSelect: async (
    IDAnaUygulama: string,
  ): Promise<DestekKonuType[]> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "SELECT_DESTEKTALEP_KONU",
      params: { IDAnaUygulama },
    });
    return data ?? [];
  },

  destekTalepInsert: async (
    params: DestekTalepInsertRequestType,
  ): Promise<DestekTalepResponseType | undefined> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "INSERT_DESTEKTALEP",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  destekTalepDelete: async (
    params: DestekTalepDeleteRequestType,
  ): Promise<DestekTalepResponseType | undefined> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "DELETE_DESTEKTALEP",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  destekTalepDurumChange: async (
    params: DestekTalepDurumRequestType,
  ): Promise<DestekTalepResponseType | undefined> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "CHANGE_DESTEKTALEP_DURUMU",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  // IDKullanici route'ta session'dan set ediliyor.
  destekMesajSelect: async (
    IDDestekTakip: string,
  ): Promise<DestekMesajType[]> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "SELECT_MESAJ",
      params: { IDDestekTakip },
    });
    return data ?? [];
  },

  destekMesajInsert: async (
    params: DestekMesajInsertRequestType,
  ): Promise<DestekTalepResponseType | undefined> => {
    const { data } = await api.post(DESTEK_ENDPOINT, {
      type: "INSERT_MESAJ",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },
};
