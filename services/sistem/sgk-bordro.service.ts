import api from "@/lib/axios";
import {
  EngelliIndirimDeleteRequestType,
  EngelliIndirimInsertRequestType,
  EngelliIndirimResponseType,
  EngelliIndirimSelectRequestType,
  EngelliIndirimType,
  EngelliIndirimUpdateRequestType,
  IzinLimitDeleteRequestType,
  KidemIhbarDeleteRequestType,
  KidemIhbarInsertRequestType,
  KidemIhbarResponseType,
  KidemIhbarSelectRequestType,
  KidemIhbarType,
  KidemIhbarUpdateRequestType,
  MeslekKoduDeleteRequestType,
  MeslekKoduInsertRequestType,
  MeslekKoduResponseType,
  MeslekKoduType,
  MeslekKoduUpdateRequestType,
  KatsayiOranDeleteRequestType,
  KatsayiOranInsertRequestType,
  KatsayiOranResponseType,
  KatsayiOranSelectRequestType,
  KatsayiOranType,
  KatsayiOranUpdateRequestType,
  YilAktarRequestType,
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
  VergiOranDeleteRequestType,
  VergiOranInsertRequestType,
  VergiOranResponseType,
  VergiOranSelectRequestType,
  VergiOranType,
  VergiOranUpdateRequestType,
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

  vergiOranSelect: async (
    params: VergiOranSelectRequestType,
  ): Promise<VergiOranType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_VERGIORAN",
      params,
    });
    return data ?? [];
  },

  vergiOranInsert: async (
    params: VergiOranInsertRequestType,
  ): Promise<VergiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_VERGIORAN",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  vergiOranUpdate: async (
    params: VergiOranUpdateRequestType,
  ): Promise<VergiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_VERGIORAN",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  vergiOranDelete: async (
    params: VergiOranDeleteRequestType,
  ): Promise<VergiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_VERGIORAN",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  vergiOranAktar: async (
    params: YilAktarRequestType,
  ): Promise<VergiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "AKTAR_VERGIORAN",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  katsayiOranSelect: async (
    params: KatsayiOranSelectRequestType,
  ): Promise<KatsayiOranType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_KATSAYI",
      params,
    });
    return data ?? [];
  },

  katsayiOranInsert: async (
    params: KatsayiOranInsertRequestType,
  ): Promise<KatsayiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_KATSAYI",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  katsayiOranUpdate: async (
    params: KatsayiOranUpdateRequestType,
  ): Promise<KatsayiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_KATSAYI",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  katsayiOranDelete: async (
    params: KatsayiOranDeleteRequestType,
  ): Promise<KatsayiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_KATSAYI",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  katsayiOranAktar: async (
    params: YilAktarRequestType,
  ): Promise<KatsayiOranResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "AKTAR_KATSAYI",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  engelliIndirimSelect: async (
    params: EngelliIndirimSelectRequestType,
  ): Promise<EngelliIndirimType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_ENGELINDIRIM",
      params,
    });
    return data ?? [];
  },

  engelliIndirimInsert: async (
    params: EngelliIndirimInsertRequestType,
  ): Promise<EngelliIndirimResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_ENGELINDIRIM",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  engelliIndirimUpdate: async (
    params: EngelliIndirimUpdateRequestType,
  ): Promise<EngelliIndirimResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_ENGELINDIRIM",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  engelliIndirimDelete: async (
    params: EngelliIndirimDeleteRequestType,
  ): Promise<EngelliIndirimResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_ENGELINDIRIM",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  engelliIndirimAktar: async (
    params: YilAktarRequestType,
  ): Promise<EngelliIndirimResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "AKTAR_ENGELINDIRIM",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  // Adi filtresi kullanılmıyor, proc'a boş gidiyor.
  meslekKoduSelect: async (): Promise<MeslekKoduType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_MESLEKKODU",
      params: { Adi: "" },
    });
    return data ?? [];
  },

  meslekKoduInsert: async (
    params: MeslekKoduInsertRequestType,
  ): Promise<MeslekKoduResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_MESLEKKODU",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  meslekKoduUpdate: async (
    params: MeslekKoduUpdateRequestType,
  ): Promise<MeslekKoduResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_MESLEKKODU",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  meslekKoduDelete: async (
    params: MeslekKoduDeleteRequestType,
  ): Promise<MeslekKoduResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_MESLEKKODU",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  kidemIhbarSelect: async (
    params: KidemIhbarSelectRequestType,
  ): Promise<KidemIhbarType[]> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "SELECT_KIDEMIHBAR",
      params,
    });
    return data ?? [];
  },

  kidemIhbarInsert: async (
    params: KidemIhbarInsertRequestType,
  ): Promise<KidemIhbarResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "INSERT_KIDEMIHBAR",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  kidemIhbarUpdate: async (
    params: KidemIhbarUpdateRequestType,
  ): Promise<KidemIhbarResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "UPDATE_KIDEMIHBAR",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  kidemIhbarDelete: async (
    params: KidemIhbarDeleteRequestType,
  ): Promise<KidemIhbarResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "DELETE_KIDEMIHBAR",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },

  kidemIhbarAktar: async (
    params: YilAktarRequestType,
  ): Promise<KidemIhbarResponseType | undefined> => {
    const { data } = await api.post(SGK_BORDRO_ENDPOINT, {
      type: "AKTAR_KIDEMIHBAR",
      params,
    });
    return Array.isArray(data) ? data[0] : data;
  },
};
