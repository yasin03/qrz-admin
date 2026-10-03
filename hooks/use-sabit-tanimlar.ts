"use client";
import { useQuery } from "@tanstack/react-query";
import type { SelectOption } from "@/types/form";
import type {
  EklentiTipi,
  GorevKodu,
  IzinTipleri,
  SabitTanimlarResponse,
  SabitTanimMadde,
  SgkBelgeTuru,
  SgkKanunNo,
  SigortaKolu,
} from "@/types/sabit-tanim";

const STALE_TIME = 1000 * 60 * 60; // 1 saat

// ---- Fetch ------------------------------------------------------------

async function postGenel(
  body: Record<string, unknown>,
  errorMessage: string,
): Promise<SabitTanimlarResponse> {
  const response = await fetch("/api/genel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

const getSabitTanimlar = () =>
  postGenel({ type: "GET_SABIT_TANIMLAR" }, "Sabit tanımlar alınamadı.");

const getPersonelSabitTanimlar = () =>
  postGenel(
    { type: "GET_PERSONEL_SABIT_TANIMLAR" },
    "Personel sabit tanımları alınamadı.",
  );

const getIzinTipleri = () =>
  postGenel({ type: "GET_IZIN_TIPLERI" }, "Personel izin tipleri alınamadı.");

const getEklentiTipleri = () =>
  postGenel(
    { type: "GET_EKLENTI_TIPLERI", Tip: "Yardım" },
    "Eklenti tipleri alınamadı.",
  );

// ---- Mappers ----------------------------------------------------------

function mapOptions<T>(
  value: unknown,
  toOption: (item: T) => SelectOption,
): SelectOption[] {
  if (!Array.isArray(value)) return [];
  return (value as T[]).map(toOption);
}

function isSabitTanimMadde(item: unknown): item is SabitTanimMadde {
  return (
    Boolean(item) &&
    typeof item === "object" &&
    "IDSabitTanimMadde" in (item as object) &&
    "SabitTanimMaddeAdi" in (item as object)
  );
}

function toOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSabitTanimMadde).map((item) => ({
    value: String(item.IDSabitTanimMadde),
    label: item.SabitTanimMaddeAdi,
  }));
}

const toSgkBelgeTuruOptions = (value: unknown) =>
  mapOptions<SgkBelgeTuru>(value, (item) => ({
    value: String(item.IDPersonelSgkBelgeTuru),
    label: String(item.Kod2),
  }));

// ID/Aciklama yok, value olarak Kod kullanılıyor.
const toSigortaKoluOptions = (value: unknown) =>
  mapOptions<SigortaKolu>(value, (item) => ({
    value: item.Kod,
    label: item.Kod2,
  }));

const toSgkKanunNoOptions = (value: unknown) =>
  mapOptions<SgkKanunNo>(value, (item) => ({
    value: String(item.IDPersonelSgkKanunNo),
    label: String(item.Kod2),
  }));

const toGorevKoduOptions = (value: unknown) =>
  mapOptions<GorevKodu>(value, (item) => ({
    value: String(item.IDPersonelSigortaliGorevKodu),
    label: item.Aciklama,
  }));

const toIzinTipleriOptions = (value: unknown) =>
  mapOptions<IzinTipleri>(value, (item) => ({
    value: String(item.KisaKod),
    label: item.Kod,
  }));

const toEklentiTipleriOptions = (value: unknown) =>
  mapOptions<EklentiTipi>(value, (item) => ({
    kod: item.SahaKodu,
    value: String(item.SahaAciklama2),
    label: item.SahaAciklama,
  }));

// ---- GET_SABIT_TANIMLAR -----------------------------------------------

export const sabitTanimlarKeys = {
  all: ["sabit-tanimlar"] as const,
};

export function useSabitTanimlar() {
  const query = useQuery({
    queryKey: sabitTanimlarKeys.all,
    queryFn: getSabitTanimlar,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME, // cache'te 1 saat tutulsun
  });

  const data = query.data ?? [];
  const odemeSekilleri = toOptions(data[4]);

  return {
    ...query,

    sgkDurumlari: toOptions(data[1]),
    istihdamDurumlari: toOptions(data[2]),
    ucretTipleri: toOptions(data[3]),
    odemeSekilleri,
    sozlesmeOdemeSekilleri: odemeSekilleri,
    sozlesmeOdemeSekilleri2: odemeSekilleri,
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

// ---- GET_PERSONEL_SABIT_TANIMLAR --------------------------------------

export const personelSabitTanimlarKeys = {
  all: ["personel-sabit-tanimlar"] as const,
  izinTipleri: ["izin-tipleri"] as const,
  eklentiTipleri: ["eklenti-tipleri", "Yardım"] as const,
};

export function usePersonelSabitTanimlar() {
  const query = useQuery({
    queryKey: personelSabitTanimlarKeys.all,
    queryFn: getPersonelSabitTanimlar,
    staleTime: STALE_TIME,
  });

  const izinQuery = useQuery({
    queryKey: personelSabitTanimlarKeys.izinTipleri,
    queryFn: getIzinTipleri,
    staleTime: STALE_TIME,
  });

  const eklentiQuery = useQuery({
    queryKey: personelSabitTanimlarKeys.eklentiTipleri,
    queryFn: getEklentiTipleri,
    staleTime: STALE_TIME,
  });

  const data = query.data ?? [];

  return {
    ...query,

    sgkBelgeTurleri: toSgkBelgeTuruOptions(data[0]),
    sigortaKollari: toSigortaKoluOptions(data[1]),
    sgkKanunNolar: toSgkKanunNoOptions(data[2]),
    gorevKodlari: toGorevKoduOptions(data[3]),
    izinTipleri: toIzinTipleriOptions(izinQuery.data),
    eklentiTipleri: toEklentiTipleriOptions(eklentiQuery.data),
  };
}
