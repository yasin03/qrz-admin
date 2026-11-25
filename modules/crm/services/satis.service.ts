import api from "@/lib/axios";
import type {
  CrmSatisAlanlari,
  CrmSatisDetay,
  CrmSatisGuncelleParams,
  CrmSatisInsertResponse,
  CrmSatisIptalParams,
  CrmSatisKaydetParams,
  CrmSatisListeFiltre,
  CrmSatisRow,
  CrmSatisYenileParams,
  CrmSatisYenilemeFiltre,
  DbId,
} from "@/modules/crm/types/satis";

const SATIS_ENDPOINT = "/api/satis";

// IDKullanici ve IDSirket route'ta her zaman session'dan set ediliyor.
async function post<T>(type: string, params: object = {}): Promise<T> {
  const { data } = await api.post(SATIS_ENDPOINT, { type, params });
  return data as T;
}

const metin = (v: string | null | undefined) => v?.trim() || null;

/**
 * Form alanları → route alanları. Kalemlerin sırası SiraNo olur.
 * Tek seferlikte dönem gönderilmez (route da NULL yazar).
 */
function satisPayload(p: CrmSatisAlanlari) {
  const abonelik = p.SatisTipi !== 1;
  return {
    SatisTipi: p.SatisTipi,
    SatisTarihi: p.SatisTarihi,
    BaslangicTarihi: abonelik ? p.BaslangicTarihi : null,
    BitisTarihi: abonelik ? p.BitisTarihi : null,
    Konu: p.Konu.trim(),
    Aciklama: metin(p.Aciklama),
    ParaBirimi: p.ParaBirimi,
    Kur: p.Kur,
    GenelIskontoOrani: p.GenelIskontoOrani,
    AraToplam: p.AraToplam,
    GenelIskontoTutari: p.GenelIskontoTutari,
    IskontoToplam: p.IskontoToplam,
    KdvToplam: p.KdvToplam,
    GenelToplam: p.GenelToplam,
    Kalemler: p.Kalemler,
  };
}

export const satisService = {
  /* ---------------- Okuma ---------------- */

  /** Satışlar (yeniden eskiye). Boş filtre → şirketin tüm satışları. */
  list: (f: CrmSatisListeFiltre = {}) =>
    post<CrmSatisRow[]>("SELECT_LIST", {
      IDCrmKisi: f.IDCrmKisi ?? null,
      Durum: f.Durum ?? null,
      SatisTipi: f.SatisTipi ?? null,
    }).then((d) => d ?? []),

  /** Başlık + kalemler. */
  detay: (IDCrmSatis: DbId) => post<CrmSatisDetay | null>("SELECT_BY_ID", { IDCrmSatis }),

  /** Bitişi yaklaşan / geçmiş, yenilenmemiş abonelikler. Gun boş → 30. */
  yenilemeList: (f: CrmSatisYenilemeFiltre = {}) =>
    post<CrmSatisRow[]>("SELECT_YENILEME", { Gun: f.Gun ?? null }).then((d) => d ?? []),

  /* ---------------- Kayıt ---------------- */

  /** Yeni satış; numara sunucuda verilir. IDCrmTeklif → kabul edilmiş tekliften dönüşüm. */
  insert: ({ IDCrmKisi, IDCrmTeklif, ...p }: CrmSatisKaydetParams) =>
    post<CrmSatisInsertResponse>("INSERT", {
      IDCrmKisi,
      IDCrmTeklif: IDCrmTeklif ?? null,
      ...satisPayload(p),
    }),

  /** Sadece geçerli satış. Kalemlerin tamamı gönderilir (yeniden yazılır). */
  update: ({ IDCrmSatis, ...p }: CrmSatisGuncelleParams) =>
    post<{ success: true }>("UPDATE", { IDCrmSatis, ...satisPayload(p) }),

  /* ---------------- Durum / yenileme ---------------- */

  /** Geçerli → İptal. Tahsilatlar silinmez; iade finans tarafında girilir. */
  iptal: ({ IDCrmSatis, IptalNedeni }: CrmSatisIptalParams) =>
    post<{ success: true }>("UPDATE_IPTAL", { IDCrmSatis, IptalNedeni: metin(IptalNedeni) }),

  /** Abonelik → bir sonraki dönem için yeni satış. SatisTarihi boş → bugün. */
  yenile: ({ IDCrmSatis, SatisTarihi }: CrmSatisYenileParams) =>
    post<CrmSatisInsertResponse>("INSERT_YENILEME", {
      IDCrmSatis,
      SatisTarihi: SatisTarihi ?? null,
    }),

  /** Yanlış girilen kayıt. Tahsilatı veya yenilemesi olan satış silinemez. */
  delete: (IDCrmSatis: DbId) => post<{ success: true }>("DELETE", { IDCrmSatis }),
};
