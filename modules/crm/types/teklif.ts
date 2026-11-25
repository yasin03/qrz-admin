/* ------------------------------------------------------------------ */
/* CRM — teklif (başlık + kalemler, durum akışı, revizyon)             */
/* SP'ler: /sql/crm_teklif.sql · API: /api/teklif                      */
/* Tutarlar FE'de hesaplanır (lib/teklif.ts → teklifHesapla) ve        */
/* olduğu gibi kaydedilir. Tarihler "yyyy-MM-dd" (Z/saat yok sayılır). */
/* ------------------------------------------------------------------ */

import type { ParaBirimi } from "@/constants/data";
import type { CrmKisiTip, CrmKisiTuru, DbId } from "@/modules/crm/types/kisiler";

export type { DbId };

/** 0 Taslak, 1 Gönderildi, 2 Kabul, 3 Red, 4 İptal, 5 Revize edildi */
export type TeklifDurum = 0 | 1 | 2 | 3 | 4 | 5;

/** Para birimi kodu; liste constants/data.ts → PARA_BIRIMI_KODLARI. */
export type TeklifParaBirimi = ParaBirimi;

/** vCrmTeklif satırı (CrmTeklif_SELECT). */
export type TeklifRow = {
  IDCrmTeklif: DbId;
  IDSirket: DbId;
  IDCrmKisi: DbId;
  IDKullanici: DbId;
  TeklifYil: number;
  TeklifSira: number;
  /** Revizyonlarda aynı kalır: "2026-0001" */
  TeklifNo: string;
  RevizyonNo: number;
  /** Ekranda gösterilecek numara: "2026-0001" / "2026-0001/R1" */
  TeklifNoTam: string;
  Durum: TeklifDurum;
  Konu: string;
  TeklifTarihi: string;
  GecerlilikTarihi: string | null;
  ParaBirimi: TeklifParaBirimi;
  Kur: number;
  GenelIskontoOrani: number;
  AraToplam: number;
  GenelIskontoTutari: number;
  IskontoToplam: number;
  KdvToplam: number;
  GenelToplam: number;
  GenelToplamTL: number;
  Aciklama: string | null;
  Kosullar: string | null;
  GonderimTarihi: string | null;
  YanitTarihi: string | null;
  RedNedeni: string | null;
  IDCrmSatis: DbId | null;
  OlusturmaTarihi: string;
  GuncellemeTarihi: string | null;

  /** Gönderilmiş ve geçerlilik tarihi geçmiş. */
  SuresiDoldu: boolean;
  KalemSayisi: number;
  RevizyonSayisi: number;

  // Kişi
  KisiTip: CrmKisiTip;
  KisiTuru: CrmKisiTuru;
  KisiAdi: string | null;
  Kurum: string | null;
  YetkiliKisi: string | null;
  CepTelefon: string | null;
  YetkiliKisiTel: string | null;
  YetkiliKisiEPostaAdresi: string | null;

  // Hazırlayan
  Ad: string | null;
  KullaniciAdi: string | null;
};

/**
 * İskontonun girilme şekli (satır ve genel iskonto): 1 Yüzde, 2 Tutar (teklifin para biriminde).
 * DB'de ayrı kolon yok: tutar iskontosu `...Orani = 0, ...Tutari > 0` olarak
 * saklanır, tip bu ikisinden çıkarılır (lib/teklif.ts → iskontoTipi).
 */
export type IskontoTipi = 1 | 2;

/** Genel iskonto girdisi (hesaplamaya giden). */
export type GenelIskontoGirdi = {
  Tip: IskontoTipi;
  /** Tip 1'de oran (0-100), tip 2'de tutar. */
  Deger: number;
};

/** Kalem için kullanıcının girdiği alanlar (hesaplamanın girdisi). */
export type TeklifKalemGirdi = {
  Aciklama: string;
  Detay: string | null;
  Miktar: number;
  Birim: string;
  BirimFiyat: number;
  IskontoTipi: IskontoTipi;
  /** Tip 1'de oran (0-100), tip 2'de tutar. */
  Iskonto: number;
  KdvOrani: number;
};

/** Kalemin hesaplanan tutarları. */
export type TeklifKalemTutarlari = {
  /** Tip 1'de girilen oran, tip 2'de 0. */
  IskontoOrani: number;
  Tutar: number;
  IskontoTutari: number;
  NetTutar: number;
  KdvTutari: number;
  ToplamTutar: number;
};

/** Kayıtlı kalem şekli (DB kolonları). */
export type TeklifKalem = Omit<TeklifKalemGirdi, "IskontoTipi" | "Iskonto"> & TeklifKalemTutarlari;

/** CrmTeklifKalem satırı (SELECT_BY_ID → Kalemler). */
export type TeklifKalemRow = TeklifKalem & {
  IDCrmTeklifKalem: DbId;
  IDCrmTeklif: DbId;
  SiraNo: number;
};

/** SELECT_BY_ID cevabı. */
export type TeklifDetay = TeklifRow & { Kalemler: TeklifKalemRow[] };

/** Başlık toplamları. */
export type TeklifToplamlari = {
  AraToplam: number;
  GenelIskontoTutari: number;
  IskontoToplam: number;
  KdvToplam: number;
  GenelToplam: number;
};

/** INSERT / UPDATE ortak alanları (tutarlar dahil). */
export type TeklifAlanlari = TeklifToplamlari & {
  IDCrmKisi: DbId;
  Konu: string;
  /** "yyyy-MM-dd" */
  TeklifTarihi: string;
  GecerlilikTarihi: string | null;
  ParaBirimi: TeklifParaBirimi;
  Kur: number;
  GenelIskontoOrani: number;
  Aciklama: string | null;
  Kosullar: string | null;
  Kalemler: TeklifKalem[];
};

export type TeklifGuncelleParams = TeklifAlanlari & { IDCrmTeklif: DbId };

export type TeklifKabulParams = {
  IDCrmTeklif: DbId;
  /** Kişi Kontak ise müşteriye dönüştürülsün mü (varsayılan true). */
  MusteriyeDonustur?: boolean;
};

export type TeklifRedParams = {
  IDCrmTeklif: DbId;
  RedNedeni?: string | null;
};

export type TeklifListeFiltre = {
  /** Boş → şirketin tüm teklifleri. */
  IDCrmKisi?: DbId | null;
  Durum?: TeklifDurum | null;
  /** false → revize edilmiş eski sürümler de gelir. Varsayılan true. */
  SadeceGuncel?: boolean;
};

export type TeklifInsertResponse = { IDCrmTeklif: DbId | null; TeklifNo: string | null };
export type TeklifRevizyonResponse = { IDCrmTeklif: DbId | null };

/**
 * PDF için teklif verisi. Kayıtlı tekliften (detay) veya henüz
 * kaydedilmemiş formdan (stepper önizleme adımı) üretilir.
 */
export type TeklifPdfVeri = {
  /** Kaydedilmemişse "Taslak". */
  TeklifNoTam: string;
  Konu: string;
  TeklifTarihi: string;
  GecerlilikTarihi: string | null;
  ParaBirimi: TeklifParaBirimi;
  Kur: number;
  GenelIskontoOrani: number;
  Aciklama: string | null;
  Kosullar: string | null;
  Kalemler: TeklifKalem[];
  Toplamlar: TeklifToplamlari;
  Kisi: {
    Ad: string;
    /** Kurum adı gösteriliyorsa yetkili kişi. */
    Yetkili: string | null;
    Telefon: string | null;
    Eposta: string | null;
  };
  Hazirlayan: string | null;
};
