import api from "@/lib/axios";
import { formatYerel, tekrarBitisHesapla } from "@/modules/core/lib/ajanda";
import type {
  AjandaDetayResponse,
  AjandaGuncelleParams,
  AjandaHatirlatmaKanal,
  AjandaHatirlatmaResponse,
  AjandaInsertResponse,
  AjandaIstisnaParams,
  AjandaIstisnaResponse,
  AjandaKatilimDurumu,
  AjandaKategori,
  AjandaKategoriKaydetParams,
  AjandaKaydetParams,
  AjandaKayitRow,
  AjandaUpdateResponse,
  DbId,
} from "@/modules/core/types/takvim";

const AJANDA_ENDPOINT = "/api/takvim/ajanda";

// IDKullanici route'ta her zaman session'dan set ediliyor.
async function post<T>(type: string, params: object = {}): Promise<T> {
  const { data } = await api.post(AJANDA_ENDPOINT, { type, params });
  return data as T;
}

/** Form değerlerini route'un beklediği şekle çevirir (tarihler yerel string). */
function kayitPayload(p: AjandaKaydetParams) {
  const tekrar = p.TekrarKurali?.trim() || null;
  return {
    Baslik: p.Baslik.trim(),
    Aciklama: p.Aciklama?.trim() || null,
    Konum: p.Konum?.trim() || null,
    IDAjandaKategori: p.IDAjandaKategori ?? null,
    Renk: p.Renk || null,
    TumGun: p.TumGun,
    Baslangic: formatYerel(p.Baslangic),
    Bitis: formatYerel(p.Bitis),
    TekrarKurali: tekrar,
    TekrarBitis: tekrar ? formatYerel(tekrarBitisHesapla(tekrar, p.Baslangic)) : null,
    Katilimcilar: p.Katilimcilar?.map(Number),
    HatirlatmaDakika: p.HatirlatmaDakika ?? null,
    HatirlatmaKanal: p.HatirlatmaDakika == null ? null : (p.HatirlatmaKanal ?? 1),
  };
}

export const ajandaService = {
  /** Aralıktaki ham kayıtlar (seriler açılmamış). */
  list: (baslangic: Date, bitis: Date) =>
    post<AjandaKayitRow[]>("SELECT_AJANDA_LIST", {
      Baslangic: formatYerel(baslangic),
      Bitis: formatYerel(bitis),
    }).then((d) => d ?? []),

  detay: (IDAjanda: DbId) => post<AjandaDetayResponse>("SELECT_AJANDA", { IDAjanda }),

  insert: (p: AjandaKaydetParams) =>
    post<AjandaInsertResponse>("INSERT_AJANDA", kayitPayload(p)),

  /** Tekil kayıt veya serinin tamamı ("tümü"). */
  update: ({ IDAjanda, IstisnalariSil, ...p }: AjandaGuncelleParams) =>
    post<AjandaUpdateResponse>("UPDATE_AJANDA", {
      IDAjanda,
      IstisnalariSil: Boolean(IstisnalariSil),
      ...kayitPayload(p),
    }),

  /** "Sadece bu tekrar": düzenle veya Iptal=true ile sil. */
  updateIstisna: (p: AjandaIstisnaParams) =>
    post<AjandaIstisnaResponse>("UPDATE_AJANDA_ISTISNA", {
      IDAjandaSeri: p.IDAjandaSeri,
      OrijinalTarih: formatYerel(p.OrijinalTarih),
      Iptal: Boolean(p.Iptal),
      Baslik: p.Baslik?.trim() || null,
      Aciklama: p.Aciklama?.trim() || null,
      Konum: p.Konum?.trim() || null,
      IDAjandaKategori: p.IDAjandaKategori ?? null,
      Renk: p.Renk || null,
      TumGun: Boolean(p.TumGun),
      Baslangic: formatYerel(p.Baslangic),
      Bitis: formatYerel(p.Bitis),
    }),

  /** Kaydı (seriyse tüm tekrarlarıyla) siler. */
  delete: (IDAjanda: DbId) => post<{ success: true }>("DELETE_AJANDA", { IDAjanda }),

  /** Davete yanıt: 0 Bekliyor, 1 Kabul, 2 Ret. */
  katilimDurumu: (IDAjanda: DbId, Durum: AjandaKatilimDurumu) =>
    post<{ success: true }>("UPDATE_KATILIMCI_DURUM", { IDAjanda, Durum }),

  /** Kendi hatırlatma ayarı. Dakika null → kapalı. */
  hatirlatmaAyari: (
    IDAjanda: DbId,
    Dakika: number | null,
    Kanal: AjandaHatirlatmaKanal | null = 1,
  ) => post<{ success: true }>("UPDATE_KATILIMCI_HATIRLATMA", { IDAjanda, Dakika, Kanal }),

  /** Uygulama içi hatırlatma adayları (ham). */
  hatirlatmalar: () => post<AjandaHatirlatmaResponse>("SELECT_HATIRLATMA"),

  /* ---------------- Kategori ---------------- */

  kategoriList: () =>
    post<AjandaKategori[]>("SELECT_KATEGORI").then((d) => d ?? []),

  kategoriInsert: (p: AjandaKategoriKaydetParams) =>
    post<{ IDAjandaKategori: DbId | null }>("INSERT_KATEGORI", p),

  kategoriUpdate: (p: Required<Pick<AjandaKategoriKaydetParams, "IDAjandaKategori">> & AjandaKategoriKaydetParams) =>
    post<{ success: true }>("UPDATE_KATEGORI", p),

  kategoriDelete: (IDAjandaKategori: DbId) =>
    post<{ success: true }>("DELETE_KATEGORI", { IDAjandaKategori }),
};
