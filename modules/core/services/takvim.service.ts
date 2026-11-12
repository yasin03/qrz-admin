import api from "@/lib/axios";
import type { TakvimGunu } from "@/modules/core/types/takvim";

export type TatilResponse = {
  year: number;
  source: "nager" | "fallback";
  gunler: TakvimGunu[];
};

export const takvimService = {
  tatiller: async (year: number): Promise<TatilResponse> => {
    const { data } = await api.get("/api/takvim/tatiller", { params: { year } });
    return data;
  },
};
