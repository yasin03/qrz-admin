import { useQuery } from "@tanstack/react-query";

type SabitTanimlarResponse = unknown[];

type SabitTanimMadde = {
  IDSabitTanimMadde: string | number;
  IDSabitTanim: string | number;
  SabitTanimMaddeAdi: string;
};

type SelectOption = {
  value: string;
  label: string;
};

function toSabitTanimList(value: unknown): SabitTanimMadde[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is SabitTanimMadde =>
      Boolean(item) &&
      typeof item === "object" &&
      "IDSabitTanimMadde" in item &&
      "SabitTanimMaddeAdi" in item,
  );
}

function toOptions(value: unknown): SelectOption[] {
  return toSabitTanimList(value).map((item) => ({
    value: String(item.IDSabitTanimMadde),
    label: item.SabitTanimMaddeAdi,
  }));
}

async function getSabitTanimlar(): Promise<SabitTanimlarResponse> {
  const response = await fetch("/api/genel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "GET_SABIT_TANIMLAR",
    }),
  });

  if (!response.ok) {
    throw new Error("Sabit tanımlar alınamadı.");
  }

  return response.json();
}

export const sabitTanimlarKeys = {
  all: ["sabit-tanimlar"] as const,
};

export function useSabitTanimlar() {
  const query = useQuery({
    queryKey: sabitTanimlarKeys.all,
    queryFn: getSabitTanimlar,
    staleTime: 1000 * 60 * 60, // 1 saat
  });

  const data = query.data ?? [];
  return {
    ...query,

    sgkDurumlari: toOptions(data[1]),
    istihdamDurumlari: toOptions(data[2]),
    ucretTipleri: toOptions(data[3]),
    odemeSekilleri: toOptions(data[4]),
    sozlesmeOdemeSekilleri: toOptions(data[4]),
    sozlesmeOdemeSekilleri2: toOptions(data[4]),
    maasParaBirimleri: toOptions(data[5]),
    calismaDurumlari: toOptions(data[6]),
    ogrenimDurumlari: toOptions(data[7]),
    medeniDurumlar: toOptions(data[8]),
    kanGruplari: toOptions(data[9]),
    uyruklar: toOptions(data[10]),
    ozurlulukDurumlari: toOptions(data[11]),
    kanBagiDurumlari: toOptions(data[12]),
  };
}
