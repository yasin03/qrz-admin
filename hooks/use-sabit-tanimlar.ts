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

type SgkBelgeTuru = {
  IDPersonelSgkBelgeTuru: string | number;
  Kod: string;
  Aciklama: string;
  Kod2: string;
};

type SigortaKolu = {
  Kod: string;
  Kod2: string;
};

type SgkKanunNo = {
  IDPersonelSgkKanunNo: string | number;
  Kod: string;
  Aciklama: string;
  Kod2: string;
};

type GorevKodu = {
  IDPersonelSigortaliGorevKodu: string | number;
  Aciklama: string;
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

function toSgkBelgeTuruOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) return [];
  return (value as SgkBelgeTuru[]).map((item) => ({
    value: String(item.IDPersonelSgkBelgeTuru),
    label: String(item.Kod2),
  }));
}

function toSigortaKoluOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) return [];
  // ID/Aciklama yok, elimizdeki tek anlamlı alan Kod — hem value hem label.
  return (value as SigortaKolu[]).map((item) => ({
    value: item.Kod,
    label: item.Kod2,
  }));
}

function toSgkKanunNoOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) return [];
  return (value as SgkKanunNo[]).map((item) => ({
    value: String(item.IDPersonelSgkKanunNo),
    label: String(item.Kod2),
  }));
}

function toGorevKoduOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) return [];
  return (value as GorevKodu[]).map((item) => ({
    value: String(item.IDPersonelSigortaliGorevKodu),
    label: item.Aciklama,
  }));
}

// ---- GET_PERSONEL_SABIT_TANIMLAR --------------------------------------

async function getPersonelSabitTanimlar(): Promise<SabitTanimlarResponse> {
  const response = await fetch("/api/genel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "GET_PERSONEL_SABIT_TANIMLAR",
    }),
  });

  if (!response.ok) {
    throw new Error("Personel sabit tanımları alınamadı.");
  }

  return response.json();
}

export const personelSabitTanimlarKeys = {
  all: ["personel-sabit-tanimlar"] as const,
};

export function usePersonelSabitTanimlar() {
  const query = useQuery({
    queryKey: personelSabitTanimlarKeys.all,
    queryFn: getPersonelSabitTanimlar,
    staleTime: 1000 * 60 * 60, // 1 saat
  });

  const data = query.data ?? [];
  return {
    ...query,

    sgkBelgeTurleri: toSgkBelgeTuruOptions(data[0]),
    sigortaKollari: toSigortaKoluOptions(data[1]),
    sgkKanunNolar: toSgkKanunNoOptions(data[2]),
    gorevKodlari: toGorevKoduOptions(data[3]),
  };
}
