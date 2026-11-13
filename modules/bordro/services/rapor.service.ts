import api from "@/lib/axios";
import {
  AvansRaporResponseType,
  AvansRaporSelectRequestType,
  IzinRaporGenelResponseType,
  IzinRaporGenelSelectRequestType,
  IzinRaporYillikResponseType,
  IzinRaporYillikSelectRequestType,
  PdksRaporResponseType,
  PdksRaporSelectRequestType,
} from "@/modules/bordro/types/rapor";

const RAPOR_ENDPOINT = "/api/raporlar";

async function selectRapor<T>(type: string, params: object): Promise<T[]> {
  const { data } = await api.post(RAPOR_ENDPOINT, { type, ...params });
  return data ?? [];
}

export const raporService = {
  selectPdks: (params: PdksRaporSelectRequestType) =>
    selectRapor<PdksRaporResponseType>("SELECT_RAPOR_PDKS", params),

  selectAvans: (params: AvansRaporSelectRequestType) =>
    selectRapor<AvansRaporResponseType>("SELECT_AVANS_RAPOR", params),

  selectIzinGenel: (params: IzinRaporGenelSelectRequestType) =>
    selectRapor<IzinRaporGenelResponseType>("SELECT_IZIN_RAPOR_GENEL", params),

  selectIzinYillik: (params: IzinRaporYillikSelectRequestType) =>
    selectRapor<IzinRaporYillikResponseType>(
      "SELECT_IZIN_RAPOR_YILLIK",
      params,
    ),
};
