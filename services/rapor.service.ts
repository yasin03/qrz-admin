import api from "@/lib/axios";
import {
  PdksRaporResponseType,
  PdksRaporSelectRequestType,
} from "@/types/rapor";

const RAPOR_ENDPOINT = "/api/raporlar";

export const raporService = {
  selectPdks: async (
    params: PdksRaporSelectRequestType,
  ): Promise<PdksRaporResponseType[]> => {
    const { data } = await api.post(RAPOR_ENDPOINT, {
      type: "SELECT_RAPOR_PDKS",
      ...params,
    });
    return data ?? [];
  },
};
