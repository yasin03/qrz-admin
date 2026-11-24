import api from "@/lib/axios";
import type {
  DbId,
  TeklifAlanlari,
  TeklifDetay,
  TeklifGuncelleParams,
  TeklifInsertResponse,
  TeklifKabulParams,
  TeklifListeFiltre,
  TeklifRedParams,
  TeklifRevizyonResponse,
  TeklifRow,
} from "@/modules/crm/types/teklif";

const TEKLIF_ENDPOINT = "/api/teklif";

// IDKullanici ve IDSirket route'ta her zaman session'dan set ediliyor.
async function post<T>(type: string, params: object = {}): Promise<T> {
  const { data } = await api.post(TEKLIF_ENDPOINT, { type, params });
  return data as T;
}

/** Form alanları → route alanları. Kalemlerin sırası SiraNo olur. */
function teklifPayload(p: TeklifAlanlari) {
  return {
    IDCrmKisi: p.IDCrmKisi,
    Konu: p.Konu,
    TeklifTarihi: p.TeklifTarihi,
    GecerlilikTarihi: p.GecerlilikTarihi,
    ParaBirimi: p.ParaBirimi,
    Kur: p.Kur,
    GenelIskontoOrani: p.GenelIskontoOrani,
    AraToplam: p.AraToplam,
    GenelIskontoTutari: p.GenelIskontoTutari,
    IskontoToplam: p.IskontoToplam,
    KdvToplam: p.KdvToplam,
    GenelToplam: p.GenelToplam,
    Aciklama: p.Aciklama,
    Kosullar: p.Kosullar,
    Kalemler: p.Kalemler,
  };
}

export const teklifService = {
  /* ---------------- Okuma ---------------- */

  /** Teklifler (yeniden eskiye). Varsayılan: sadece güncel sürümler. */
  list: (f: TeklifListeFiltre = {}) =>
    post<TeklifRow[]>("SELECT_LIST", {
      IDCrmKisi: f.IDCrmKisi ?? null,
      Durum: f.Durum ?? null,
      SadeceGuncel: f.SadeceGuncel ?? true,
    }).then((d) => d ?? []),

  /** Başlık + kalemler. */
  detay: (IDCrmTeklif: DbId) => post<TeklifDetay | null>("SELECT_BY_ID", { IDCrmTeklif }),

  /** Bir teklifin tüm sürümleri (en yeni üstte). */
  revizyonlar: (TeklifNo: string) =>
    post<TeklifRow[]>("SELECT_REVIZYON", { TeklifNo }).then((d) => d ?? []),

  /* ---------------- Kayıt ---------------- */

  /** Yeni taslak; numara sunucuda verilir. */
  insert: (p: TeklifAlanlari) => post<TeklifInsertResponse>("INSERT", teklifPayload(p)),

  /** Sadece taslak. Kalemlerin tamamı gönderilir (yeniden yazılır). */
  update: ({ IDCrmTeklif, ...p }: TeklifGuncelleParams) =>
    post<{ success: true }>("UPDATE", { IDCrmTeklif, ...teklifPayload(p) }),

  /* ---------------- Durum akışı ---------------- */

  /** Taslak → Gönderildi. */
  gonder: (IDCrmTeklif: DbId) => post<{ success: true }>("UPDATE_GONDER", { IDCrmTeklif }),

  /** Gönderildi → Kabul (kişi Kontak ise varsayılan olarak müşteri olur). */
  kabul: ({ IDCrmTeklif, MusteriyeDonustur = true }: TeklifKabulParams) =>
    post<{ success: true }>("UPDATE_KABUL", { IDCrmTeklif, MusteriyeDonustur }),

  /** Gönderildi → Red. */
  red: ({ IDCrmTeklif, RedNedeni }: TeklifRedParams) =>
    post<{ success: true }>("UPDATE_RED", { IDCrmTeklif, RedNedeni: RedNedeni?.trim() || null }),

  /** Taslak / Gönderildi → İptal. */
  iptal: (IDCrmTeklif: DbId) => post<{ success: true }>("UPDATE_IPTAL", { IDCrmTeklif }),

  /** İptal → önceki durum (gönderilmemişse Taslak, gönderilmişse Gönderildi). */
  iptalGeriAl: (IDCrmTeklif: DbId) => post<{ success: true }>("UPDATE_IPTAL_GERI_AL", { IDCrmTeklif }),

  /** Gönderildi / Red → yeni taslak sürüm. Döner: yeni IDCrmTeklif. */
  revizyon: (IDCrmTeklif: DbId) => post<TeklifRevizyonResponse>("INSERT_REVIZYON", { IDCrmTeklif }),

  /** Sadece taslak. */
  delete: (IDCrmTeklif: DbId) => post<{ success: true }>("DELETE", { IDCrmTeklif }),
};
