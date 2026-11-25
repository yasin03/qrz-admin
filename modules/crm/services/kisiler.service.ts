import api from "@/lib/axios";
import { formatYerel } from "@/modules/core/lib/ajanda";
import type {
  CrmAktiviteAlanlari,
  CrmAktiviteGuncelleParams,
  CrmAktiviteInsertResponse,
  CrmAktiviteKaydetParams,
  CrmAktiviteListeFiltre,
  CrmAktiviteRow,
  CrmAktiviteTamamlaParams,
  CrmKisiAlanlari,
  CrmKisiDeleteResponse,
  CrmKisiGuncelleParams,
  CrmKisiInsertResponse,
  CrmKisiKaydetParams,
  CrmKisiRow,
  CrmKisiTip,
  CrmYaklasanAktiviteRow,
  CrmYaklasanFiltre,
  DbId,
} from "@/modules/crm/types/kisiler";

const KISILER_ENDPOINT = "/api/kisiler";

// IDKullanici ve IDSirket route'ta her zaman session'dan set ediliyor.
async function post<T>(type: string, params: object = {}): Promise<T> {
  const { data } = await api.post(KISILER_ENDPOINT, { type, params });
  return data as T;
}

const metin = (v: string | null | undefined) => v?.trim() || null;

/** Kişi formu → route alanları (boş metin NULL). */
function kisiPayload(p: CrmKisiAlanlari) {
  return {
    Kurum: metin(p.Kurum),
    YetkiliKisi: metin(p.YetkiliKisi),
    YetkiliKisiPozisyonu: metin(p.YetkiliKisiPozisyonu),
    YetkiliKisiTel: metin(p.YetkiliKisiTel),
    YetkiliKisiEPostaAdresi: metin(p.YetkiliKisiEPostaAdresi),
    Adres: metin(p.Adres),
    IlKodu: metin(p.IlKodu),
    KisiTuru: p.KisiTuru ?? null,
    VergiNo: metin(p.VergiNo),
    TcKimlikNo: metin(p.TcKimlikNo),
    CepTelefon: metin(p.CepTelefon),
    Fax: metin(p.Fax),
    WebSitesi: metin(p.WebSitesi),
    Linkedin: metin(p.Linkedin),
    Facebook: metin(p.Facebook),
    Twitter: metin(p.Twitter),
    Instagram: metin(p.Instagram),
    Notlar: metin(p.Notlar),
    Kaynak: metin(p.Kaynak),
  };
}

/** Aktivite formu → route alanları. */
function aktivitePayload(p: CrmAktiviteAlanlari) {
  return {
    Tarih: formatYerel(p.Tarih),
    Sure: p.Sure ?? null,
    GorusmeAraci: metin(p.GorusmeAraci),
    Konu: metin(p.Konu),
    Aciklama: metin(p.Aciklama),
    HatirlatmaDakika: p.HatirlatmaDakika ?? null,
    HatirlatmaKanal: p.HatirlatmaDakika == null ? null : (p.HatirlatmaKanal ?? 1),
  };
}

export const kisilerService = {
  /* ---------------- Kişi ---------------- */

  /** Şirketin kontakları veya müşterileri. */
  kisiList: (Tip: CrmKisiTip) =>
    post<CrmKisiRow[]>("SELECT_KISI_LIST", { Tip }).then((d) => d ?? []),

  /**
   * Yeni kişi. İzin bayrakları / Durum / KisiTuru verilmezse gönderilmez,
   * SP varsayılanı kullanılır.
   */
  kisiInsert: ({ Tip, IletisimNotu, EmailKabul, SmsKabul, AramaKabul, WhatsappKabul, Durum, ...p }: CrmKisiKaydetParams) =>
    post<CrmKisiInsertResponse>("INSERT_KISI", {
      Tip,
      ...kisiPayload(p),
      KisiTuru: p.KisiTuru ?? undefined,
      EmailKabul: EmailKabul ?? undefined,
      SmsKabul: SmsKabul ?? undefined,
      AramaKabul: AramaKabul ?? undefined,
      WhatsappKabul: WhatsappKabul ?? undefined,
      Durum: Durum ?? undefined,
      IletisimNotu: metin(IletisimNotu),
    }),

  /** Formdaki tüm alanlar gönderilir. KisiTuru / Durum boşsa mevcut değer kalır. */
  kisiUpdate: ({ IDCrmKisi, ...p }: CrmKisiGuncelleParams) =>
    post<{ success: true }>("UPDATE_KISI", {
      IDCrmKisi,
      ...kisiPayload(p),
      EmailKabul: p.EmailKabul ?? null,
      SmsKabul: p.SmsKabul ?? null,
      AramaKabul: p.AramaKabul ?? null,
      WhatsappKabul: p.WhatsappKabul ?? null,
      Durum: p.Durum ?? null,
    }),

  /** Kontak → Müşteri (aktiviteler aynı kişide kalır). */
  musteriyeDonustur: (IDCrmKisi: DbId) =>
    post<{ success: true }>("UPDATE_KISI_MUSTERIYE_DONUSTUR", { IDCrmKisi }),

  /** Kişiyi aktiviteleriyle siler; bağlı takvim kayıtları da kalkar. */
  /** Tahsilatı varsa silinmez, pasife alınır (Sonuc: "PASIF"). */
  kisiDelete: (IDCrmKisi: DbId) => post<CrmKisiDeleteResponse>("DELETE_KISI", { IDCrmKisi }),

  /* ---------------- Aktivite ---------------- */

  /** Zaman çizelgesi (yeniden eskiye). */
  aktiviteList: (f: CrmAktiviteListeFiltre = {}) =>
    post<CrmAktiviteRow[]>("SELECT_AKTIVITE_LIST", {
      IDCrmKisi: f.IDCrmKisi ?? null,
      Durum: f.Durum ?? null,
    }).then((d) => d ?? []),

  /** Yaklaşan + gecikmiş randevular (eskiden yeniye). */
  yaklasan: (f: CrmYaklasanFiltre = {}) =>
    post<CrmYaklasanAktiviteRow[]>("SELECT_AKTIVITE_YAKLASAN", {
      Gun: f.Gun ?? 7,
      Benim: Boolean(f.Benim),
    }).then((d) => d ?? []),

  /** Takvim kaydının bağlı olduğu CRM aktivitesi (yoksa null). */
  aktiviteByAjanda: (IDAjanda: DbId) =>
    post<CrmAktiviteRow | null>("SELECT_AKTIVITE_BY_AJANDA", { IDAjanda }),

  /** Durum 1 → görüşme, 0 → randevu (takvim kaydı SP'de açılır). */
  aktiviteInsert: ({ IDCrmKisi, Durum, ...p }: CrmAktiviteKaydetParams) =>
    post<CrmAktiviteInsertResponse>("INSERT_AKTIVITE", {
      IDCrmKisi,
      Durum,
      ...aktivitePayload(p),
    }),

  /** Formdaki tüm alanlar gönderilir. Randevuda takvim kaydı da güncellenir. */
  aktiviteUpdate: ({ IDCrmAktivite, ...p }: CrmAktiviteGuncelleParams) =>
    post<{ success: true }>("UPDATE_AKTIVITE", {
      IDCrmAktivite,
      ...aktivitePayload(p),
    }),

  /** Randevu → görüşme. Boş alanlarda mevcut değer kalır. */
  aktiviteTamamla: (p: CrmAktiviteTamamlaParams) =>
    post<{ success: true }>("UPDATE_AKTIVITE_TAMAMLA", {
      IDCrmAktivite: p.IDCrmAktivite,
      Aciklama: metin(p.Aciklama),
      Sure: p.Sure ?? null,
      Tarih: formatYerel(p.Tarih),
    }),

  /** Randevuyu iptal eder; takvimden kalkar. */
  aktiviteIptal: (IDCrmAktivite: DbId) =>
    post<{ success: true }>("UPDATE_AKTIVITE_IPTAL", { IDCrmAktivite }),

  aktiviteDelete: (IDCrmAktivite: DbId) =>
    post<{ success: true }>("DELETE_AKTIVITE", { IDCrmAktivite }),
};
