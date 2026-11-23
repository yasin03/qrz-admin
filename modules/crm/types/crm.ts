/* ------------------------------------------------------------------ */
/* CRM — kişi (kontak / müşteri) ve aktivite (görüşme + randevu)       */
/* SP'ler: /sql/crm_duzeltme.sql · API: /api/crm                       */
/* Tarihler API'de "yyyy-MM-ddTHH:mm:ss(.sss)Z" gelir ama TR yerel      */
/* saatidir (Z yok sayılır) — bkz. modules/core/lib/ajanda.ts           */
/* ------------------------------------------------------------------ */

import type { AjandaHatirlatmaKanal, DbId } from "@/modules/core/types/takvim";

export type { DbId };

/** Kaydın aşaması. Kontak → Müşteri dönüşümü ayrı işlemle yapılır. */
export type CrmKisiTip = "Kontak" | "Musteri";

/** 1 Gerçek kişi, 2 Tüzel kişi */
export type CrmKisiTuru = 1 | 2;

/** 0 Planlandı (randevu), 1 Yapıldı (görüşme), 2 İptal */
export type CrmAktiviteDurum = 0 | 1 | 2;

/** Bit flag: 1 Uygulama içi, 2 E-posta, 3 İkisi (ajanda ile aynı). */
export type CrmHatirlatmaKanal = AjandaHatirlatmaKanal;

/* ---------------- Kişi ---------------- */

/** vCrmKisi satırı (CrmKisi_SELECT). */
export type CrmKisiRow = {
  IDCrmKisi: DbId;
  IDSirket: DbId;
  IDKullanici: DbId;
  Tip: CrmKisiTip;
  MusteriOlmaTarihi: string | null;
  KisiTuru: CrmKisiTuru;

  Kurum: string | null;
  YetkiliKisi: string | null;
  YetkiliKisiPozisyonu: string | null;
  YetkiliKisiTel: string | null;
  YetkiliKisiEPostaAdresi: string | null;
  Adres: string | null;
  /** Bağlı olduğu il (3 haneli kod, ör. "034"). Ad için useIller. */
  IlKodu: string | null;

  VergiNo: string | null;
  TcKimlikNo: string | null;

  CepTelefon: string | null;
  Fax: string | null;
  WebSitesi: string | null;
  Linkedin: string | null;
  Facebook: string | null;
  Twitter: string | null;
  Instagram: string | null;

  EmailKabul: boolean | null;
  SmsKabul: boolean | null;
  AramaKabul: boolean | null;
  WhatsappKabul: boolean | null;

  Notlar: string | null;
  Durum: boolean;
  Kaynak: string | null;
  OlusturmaTarihi: string;
  GuncellemeTarihi: string | null;

  /** Yapılmış görüşme sayısı. */
  GorusmeSayisi: number;
  /** Planlanmış (bekleyen) randevu sayısı. */
  BekleyenRandevuSayisi: number;
  SonGorusmeTarihi: string | null;
  SiradakiRandevuTarihi: string | null;

  /** Oluşturan kullanıcı. */
  Ad: string | null;
  KullaniciAdi: string | null;
};

/** Kişi formu alanları (ekle / güncelle ortak). */
export type CrmKisiAlanlari = {
  Kurum?: string | null;
  YetkiliKisi?: string | null;
  YetkiliKisiPozisyonu?: string | null;
  YetkiliKisiTel?: string | null;
  YetkiliKisiEPostaAdresi?: string | null;
  Adres?: string | null;
  IlKodu?: string | null;
  KisiTuru?: CrmKisiTuru | null;
  VergiNo?: string | null;
  TcKimlikNo?: string | null;
  CepTelefon?: string | null;
  Fax?: string | null;
  WebSitesi?: string | null;
  Linkedin?: string | null;
  Facebook?: string | null;
  Twitter?: string | null;
  Instagram?: string | null;
  EmailKabul?: boolean | null;
  SmsKabul?: boolean | null;
  AramaKabul?: boolean | null;
  WhatsappKabul?: boolean | null;
  Notlar?: string | null;
  Durum?: boolean | null;
  Kaynak?: string | null;
};

/**
 * Yeni kişi. Tip verilmezse 'Kontak'. Gönderilmeyen izin bayrakları / Durum /
 * KisiTuru için SP varsayılanı kullanılır (izinler açık, Tüzel, aktif).
 */
export type CrmKisiKaydetParams = CrmKisiAlanlari & {
  Tip?: CrmKisiTip;
  /** Kaynak = 'İletişim' ise form mesajı; otomatik görüşme olarak kaydedilir. */
  IletisimNotu?: string | null;
};

/** Güncelleme: formdaki tüm alanlar gönderilir (boş alan NULL olur). Tip değişmez. */
export type CrmKisiGuncelleParams = CrmKisiAlanlari & {
  IDCrmKisi: DbId;
};

export type CrmKisiInsertResponse = {
  IDCrmKisi: DbId | null;
};

/* ---------------- Aktivite ---------------- */

/** vCrmAktivite satırı (CrmAktivite_SELECT / _Yaklasan / _ByIDAjanda). */
export type CrmAktiviteRow = {
  IDCrmAktivite: DbId;
  IDCrmKisi: DbId;
  IDSirket: DbId;
  KisiTip: CrmKisiTip;
  Kurum: string | null;
  YetkiliKisi: string | null;
  YetkiliKisiTel: string | null;
  CepTelefon: string | null;
  YetkiliKisiEPostaAdresi: string | null;

  /** Takvimden silinmiş randevu 2 (İptal) olarak gelir. */
  Durum: CrmAktiviteDurum;
  /** Planlanmış randevuda takvimdeki güncel saat. */
  Tarih: string;
  Sure: number | null;
  GorusmeAraci: string | null;
  Konu: string | null;
  Aciklama: string | null;

  /** Planlanan aktivitenin takvim kaydı. */
  IDAjanda: DbId | null;
  HatirlatmaDakika: number | null;
  HatirlatmaKanal: CrmHatirlatmaKanal | null;

  IDKullanici: DbId;
  Ad: string | null;
  KullaniciAdi: string | null;
  OlusturmaTarihi: string;
  GuncellemeTarihi: string | null;
};

/** CrmAktivite_SELECT_Yaklasan satırı. */
export type CrmYaklasanAktiviteRow = CrmAktiviteRow & {
  /** Tarihi geçmiş ama tamamlanmamış. */
  Gecikmis: boolean;
};

/** Aktivite formu alanları (ekle / güncelle ortak). */
export type CrmAktiviteAlanlari = {
  Tarih: Date;
  /** Dakika (randevuda tahmini süre). */
  Sure?: number | null;
  GorusmeAraci?: string | null;
  Konu?: string | null;
  Aciklama?: string | null;
  /** Sadece randevuda anlamlı. null → hatırlatma yok. */
  HatirlatmaDakika?: number | null;
  HatirlatmaKanal?: CrmHatirlatmaKanal | null;
};

/** Yeni aktivite. Durum 1 → görüşme, 0 → randevu (takvime düşer). */
export type CrmAktiviteKaydetParams = CrmAktiviteAlanlari & {
  IDCrmKisi: DbId;
  Durum: 0 | 1;
};

/** Güncelleme: formdaki tüm alanlar gönderilir. Durum değişmez (Tamamla / İptal). */
export type CrmAktiviteGuncelleParams = CrmAktiviteAlanlari & {
  IDCrmAktivite: DbId;
};

/** Randevu → görüşme. Boş alanlarda mevcut değer kalır. */
export type CrmAktiviteTamamlaParams = {
  IDCrmAktivite: DbId;
  /** Görüşme notu. */
  Aciklama?: string | null;
  /** Gerçekleşen süre (dk). */
  Sure?: number | null;
  /** Gerçekleşen zaman; boş → planlanan zaman. */
  Tarih?: Date | null;
};

export type CrmAktiviteListeFiltre = {
  /** Boş → şirketin tüm aktiviteleri. */
  IDCrmKisi?: DbId | null;
  /** Boş → hepsi. */
  Durum?: CrmAktiviteDurum | null;
};

export type CrmYaklasanFiltre = {
  /** Kaç gün ilerisi (varsayılan 7). Gecikmişler her zaman dahil. */
  Gun?: number;
  /** true → sadece oturumdaki kullanıcının randevuları. */
  Benim?: boolean;
};

export type CrmAktiviteInsertResponse = {
  IDCrmAktivite: DbId | null;
  /** Randevuda açılan takvim kaydı, görüşmede null. */
  IDAjanda: DbId | null;
};
