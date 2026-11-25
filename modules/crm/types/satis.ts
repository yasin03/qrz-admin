/* ------------------------------------------------------------------ */
/* CRM — satış (başlık + kalemler, iptal, abonelik yenileme)           */
/* SP'ler: /sql/crm_satis.sql · API: /api/satis                        */
/* Satış para hareketi tutmaz; tahsilat / kalan / ödeme durumu         */
/* types/finans.ts'tedir. Tutarlar FE'de hesaplanır (lib/teklif.ts →   */
/* teklifHesapla). Tarihler "yyyy-MM-dd" (Z/saat yok sayılır).         */
/* ------------------------------------------------------------------ */

import type { ParaBirimi } from "@/constants/data";
import type { CrmKisiTip, CrmKisiTuru, DbId } from "@/modules/crm/types/kisiler";
import type { TeklifKalem, TeklifToplamlari } from "@/modules/crm/types/teklif";

export type { DbId };

/** 0 Geçerli, 1 İptal */
export type SatisDurum = 0 | 1;

/** 1 Tek seferlik, 2 Aylık abonelik, 3 Yıllık abonelik */
export type SatisTipi = 1 | 2 | 3;

/**
 * Hesaplanan dönem durumu (vCrmSatis.DonemDurumu).
 * 0 Tek seferlik, 1 Başlamadı, 2 Devam ediyor, 3 Süresi doldu.
 * İptal edilmiş satışta NULL.
 */
export type SatisDonemDurumu = 0 | 1 | 2 | 3;

/* ------------------------------------------------------------------ */
/* Okuma                                                               */
/* ------------------------------------------------------------------ */

/** vCrmSatis satırı (CrmSatis_SELECT, _SELECT_Yenileme). */
export type CrmSatisRow = {
  IDCrmSatis: DbId;
  IDSirket: DbId;
  IDCrmKisi: DbId;
  IDKullanici: DbId;
  /** Tekliften dönüştürüldüyse kaynak teklif. */
  IDCrmTeklif: DbId | null;
  /** Yenilemeyle açıldıysa önceki dönemin satışı. */
  IDCrmSatisOnceki: DbId | null;
  SatisYil: number;
  SatisSira: number;
  /** "S2026-0001" */
  SatisNo: string;
  SatisTipi: SatisTipi;
  Durum: SatisDurum;
  SatisTarihi: string;
  /** Sadece abonelikte dolu. */
  BaslangicTarihi: string | null;
  BitisTarihi: string | null;
  Konu: string;
  Aciklama: string | null;
  ParaBirimi: ParaBirimi;
  Kur: number;
  GenelIskontoOrani: number;
  AraToplam: number;
  GenelIskontoTutari: number;
  IskontoToplam: number;
  KdvToplam: number;
  GenelToplam: number;
  GenelToplamTL: number;
  IptalTarihi: string | null;
  IptalNedeni: string | null;
  OlusturmaTarihi: string;
  GuncellemeTarihi: string | null;

  /** İptalde null. */
  DonemDurumu: SatisDonemDurumu | null;
  /** Bitişe kalan gün (geçmişse eksi). Sadece abonelik; tek seferlikte null. */
  YenilemeGunKalan: number | null;
  /** Geçerli bir sonraki dönem satışı var mı. */
  YenilendiMi: boolean;
  IDCrmSatisSonraki: DbId | null;
  SonrakiSatisNo: string | null;
  OncekiSatisNo: string | null;
  /** Kaynak teklifin numarası: "2026-0001" / "2026-0001/R1". */
  TeklifNoTam: string | null;
  KalemSayisi: number;

  // Kişi
  KisiTip: CrmKisiTip;
  KisiTuru: CrmKisiTuru;
  KisiAdi: string | null;
  Kurum: string | null;
  YetkiliKisi: string | null;
  CepTelefon: string | null;
  YetkiliKisiTel: string | null;
  YetkiliKisiEPostaAdresi: string | null;

  // Satışı yapan
  Ad: string | null;
  KullaniciAdi: string | null;
};

/** CrmSatisKalem satırı (SELECT_BY_ID → Kalemler). Kolonlar teklif kalemiyle aynı. */
export type CrmSatisKalemRow = TeklifKalem & {
  IDCrmSatisKalem: DbId;
  IDCrmSatis: DbId;
  SiraNo: number;
};

/** SELECT_BY_ID cevabı. */
export type CrmSatisDetay = CrmSatisRow & { Kalemler: CrmSatisKalemRow[] };

/* ------------------------------------------------------------------ */
/* Kayıt                                                               */
/* ------------------------------------------------------------------ */

/** INSERT / UPDATE ortak alanları (tutarlar dahil). Kalemler TeklifKalem ile aynı. */
export type CrmSatisAlanlari = TeklifToplamlari & {
  SatisTipi: SatisTipi;
  /** "yyyy-MM-dd" */
  SatisTarihi: string;
  /** Abonelikte zorunlu; tek seferlikte API null yazar. */
  BaslangicTarihi: string | null;
  BitisTarihi: string | null;
  Konu: string;
  Aciklama: string | null;
  ParaBirimi: ParaBirimi;
  /** TRY'de API 1 yazar. */
  Kur: number;
  GenelIskontoOrani: number;
  Kalemler: TeklifKalem[];
};

/** INSERT. Kişi ve kaynak teklif sadece burada verilir, sonra değişmez. */
export type CrmSatisKaydetParams = CrmSatisAlanlari & {
  IDCrmKisi: DbId;
  /** Kabul edilmiş tekliften dönüşümde dolu. */
  IDCrmTeklif?: DbId | null;
};

/** UPDATE (sadece geçerli satış). Kalemlerin tamamı gönderilir, yeniden yazılır. */
export type CrmSatisGuncelleParams = CrmSatisAlanlari & { IDCrmSatis: DbId };

export type CrmSatisIptalParams = {
  IDCrmSatis: DbId;
  IptalNedeni?: string | null;
};

/** Abonelik → bir sonraki dönem. SatisTarihi boş → bugün. */
export type CrmSatisYenileParams = {
  IDCrmSatis: DbId;
  SatisTarihi?: string | null;
};

/** INSERT ve INSERT_YENILEME cevabı. */
export type CrmSatisInsertResponse = { IDCrmSatis: DbId | null; SatisNo: string | null };

/* ------------------------------------------------------------------ */
/* Filtre                                                              */
/* ------------------------------------------------------------------ */

export type CrmSatisListeFiltre = {
  /** Boş → şirketin tüm satışları. */
  IDCrmKisi?: DbId | null;
  /** Boş → hepsi. */
  Durum?: SatisDurum | null;
  /** Boş → hepsi. */
  SatisTipi?: SatisTipi | null;
};

export type CrmSatisYenilemeFiltre = {
  /** Bitişi kaç gün içinde olanlar (geçmişler dahil). Boş → 30. */
  Gun?: number | null;
};
