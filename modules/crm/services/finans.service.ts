import api from "@/lib/axios";
import type {
  CrmFinansAlacakFiltre,
  CrmFinansCariFiltre,
  CrmFinansCariRow,
  CrmFinansOzet,
  CrmFinansSatisRow,
  CrmSatisTahsilatRow,
  CrmTahsilatAlanlari,
  CrmTahsilatGuncelleParams,
  CrmTahsilatInsertResponse,
  CrmTahsilatKaydetParams,
  CrmTahsilatListeFiltre,
  CrmTahsilatRow,
  DbId,
} from "@/modules/crm/types/finans";

const FINANS_ENDPOINT = "/api/finans";

// IDKullanici ve IDSirket route'ta her zaman session'dan set ediliyor.
async function post<T>(type: string, params: object = {}): Promise<T> {
  const { data } = await api.post(FINANS_ENDPOINT, { type, params });
  return data as T;
}

const metin = (v: string | null | undefined) => v?.trim() || null;

/**
 * Tahsilat formu → route alanları (boş metin NULL).
 * Kur verilmezse gönderilmez: INSERT'te satışın kuru, UPDATE'te mevcut kur.
 */
function tahsilatPayload(p: CrmTahsilatAlanlari) {
  return {
    Tip: p.Tip,
    Tarih: p.Tarih,
    Tutar: p.Tutar,
    Kur: p.Kur ?? undefined,
    OdemeSekli: p.OdemeSekli,
    FaturaNo: metin(p.FaturaNo),
    FaturaTarihi: p.FaturaTarihi || null,
    Aciklama: metin(p.Aciklama),
  };
}

export const finansService = {
  /* ---------------- Satışlar sekmesi ---------------- */

  /** Ödeme rozeti: satış başına net tahsilat. Tahsilatı olmayan satış listede yoktur. */
  satisTahsilatList: () =>
    post<CrmSatisTahsilatRow[]>("SELECT_SATIS_TAHSILAT").then((d) => d ?? []),

  /* ---------------- Finans sekmesi ---------------- */

  /** Alacaklar (eskiden yeniye). SadeceAcik verilmezse true. */
  alacakList: (f: CrmFinansAlacakFiltre = {}) =>
    post<CrmFinansSatisRow[]>("SELECT_ALACAK", {
      IDCrmKisi: f.IDCrmKisi ?? null,
      OdemeDurumu: f.OdemeDurumu ?? null,
      SadeceAcik: f.SadeceAcik,
    }).then((d) => d ?? []),

  /** Müşteri bakiyeleri (TL, bakiyesi yüksekten). */
  cariList: (f: CrmFinansCariFiltre = {}) =>
    post<CrmFinansCariRow[]>("SELECT_CARI", { SadeceBakiyeli: f.SadeceBakiyeli }).then(
      (d) => d ?? [],
    ),

  /** Özet kartlar. */
  ozet: () => post<CrmFinansOzet | null>("SELECT_OZET"),

  /* ---------------- Tahsilat ---------------- */

  /** Tahsilat / iade listesi (yeniden eskiye). Boş filtre → hepsi. */
  tahsilatList: (f: CrmTahsilatListeFiltre = {}) =>
    post<CrmTahsilatRow[]>("SELECT_TAHSILAT_LIST", {
      IDCrmSatis: f.IDCrmSatis ?? null,
      IDCrmKisi: f.IDCrmKisi ?? null,
      Baslangic: f.Baslangic ?? null,
      Bitis: f.Bitis ?? null,
      Tip: f.Tip ?? null,
    }).then((d) => d ?? []),

  tahsilatDetay: (IDCrmTahsilat: DbId) =>
    post<CrmTahsilatRow | null>("SELECT_TAHSILAT_BY_ID", { IDCrmTahsilat }),

  /** Yeni tahsilat / iade. Para birimi boşsa satışınki; kişi satıştan alınır. */
  tahsilatInsert: ({ IDCrmSatis, ParaBirimi, ...p }: CrmTahsilatKaydetParams) =>
    post<CrmTahsilatInsertResponse>("INSERT_TAHSILAT", {
      IDCrmSatis,
      ParaBirimi: ParaBirimi ?? undefined,
      ...tahsilatPayload(p),
    }),

  /** Düzeltme. Satış ve para birimi değişmez. */
  tahsilatUpdate: ({ IDCrmTahsilat, ...p }: CrmTahsilatGuncelleParams) =>
    post<{ success: true }>("UPDATE_TAHSILAT", { IDCrmTahsilat, ...tahsilatPayload(p) }),

  /** Yanlış girilen kayıt. İadeler tahsil edileni aşacaksa SP reddeder. */
  tahsilatDelete: (IDCrmTahsilat: DbId) =>
    post<{ success: true }>("DELETE_TAHSILAT", { IDCrmTahsilat }),
};
