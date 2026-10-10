"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SelectOption } from "@/types/form";
import type {
  AsgariUcret,
  EklentiTipi,
  GorevKodu,
  IzinTipleri,
  MeslekKodu,
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

const getTahakkukTipleri = (tip: string) =>
  postGenel(
    { type: "GET_TAHAKKUK_TIPLERI", Tip: tip },
    "Eklenti tipleri alınamadı.",
  );

const getMeslekKodlari = (search: string) =>
  postGenel(
    { type: "GET_PERSONEL_MESLEKKODU", Adi: search },
    "Meslek kodları alınamadı.",
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

// Personel kaydında meslek kodu ID değil, kodun kendisi ("0210.00") tutuluyor.
const toMeslekKoduOptions = (value: unknown) =>
  mapOptions<MeslekKodu>(value, (item) => ({
    value: String(item.Kod),
    label: String(item.Kod2),
  }));

const toIzinTipleriOptions =(value: unknown) =>
  mapOptions<IzinTipleri>(value, (item) => ({
    value: String(item.KisaKod),
    label: item.Kod,
  }));

const toTahakkukTipleriOptions = (value: unknown) =>
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
  eklentiTipleri: ["tahakkuk-tipleri", "Yardım"] as const,
  kesintiTipleri: ["tahakkuk-tipleri", "Kesinti"] as const,
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
    queryFn: () => getTahakkukTipleri("Yardım"),
    staleTime: STALE_TIME,
  });

  const kesintiQuery = useQuery({
    queryKey: personelSabitTanimlarKeys.kesintiTipleri,
    queryFn: () => getTahakkukTipleri("Kesinti"),
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
    eklentiTipleri: toTahakkukTipleriOptions(eklentiQuery.data),
    kesintiTipleri: toTahakkukTipleriOptions(kesintiQuery.data),
  };
}

// ---- GET_PERSONEL_MESLEKKODU (arama ile) ------------------------------
// Meslek kodu listesi çok büyük olduğu için tamamı hiç çekilmiyor; sadece
// kullanıcının yazdığı metni içeren kayıtlar API'den isteniyor ("muh" ->
// muhasebeci, muhasebe uzmanı, ...). FormSearchSelect'e `useOptions` olarak
// verilmek üzere tasarlandı — debounce'u component yapıyor.

export const MESLEK_KODU_MIN_SEARCH = 2;

export const meslekKodlariKeys = {
  all: ["personel-meslek-kodlari"] as const,
  search: (search: string) => [...meslekKodlariKeys.all, search] as const,
};

export function useMeslekKodlari(search: string) {
  const term = search.trim();

  const query = useQuery({
    queryKey: meslekKodlariKeys.search(term),
    queryFn: () => getMeslekKodlari(term),
    enabled: term.length >= MESLEK_KODU_MIN_SEARCH,
    select: toMeslekKoduOptions,
    staleTime: STALE_TIME,
    // Yeni arama sonucu gelene kadar önceki sonuçlar listede kalsın
    // (her tuşta liste boşalıp dolmasın).
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    options: query.data ?? [],
    isLoading: query.isFetching,
  };
}

// ---- GET_ASGARI_UCRET -------------------------------------------------
// Güncel asgari ücret (Brut / Net / EmekliNet). Yılda 1-2 kez değiştiği
// için uzun süre cache'te tutuluyor; sayfa yenilenince zaten tekrar çekilir.

const ASGARI_UCRET_STALE_TIME = 1000 * 60 * 60 * 24; // 24 saat

export const asgariUcretKeys = {
  all: ["asgari-ucret"] as const,
};

const getAsgariUcret = () =>
  postGenel({ type: "GET_ASGARI_UCRET" }, "Asgari ücret bilgisi alınamadı.");

function toAsgariUcret(value: unknown): AsgariUcret | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;

  const { Brut, Net, EmekliNet } = row as Record<string, unknown>;
  return {
    Brut: Number(Brut) || 0,
    Net: Number(Net) || 0,
    EmekliNet: Number(EmekliNet) || 0,
  };
}

export function useAsgariUcret() {
  return useQuery({
    queryKey: asgariUcretKeys.all,
    queryFn: getAsgariUcret,
    select: toAsgariUcret,
    staleTime: ASGARI_UCRET_STALE_TIME,
    gcTime: ASGARI_UCRET_STALE_TIME,
  });
}
