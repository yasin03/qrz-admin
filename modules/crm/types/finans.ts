/* ------------------------------------------------------------------ */
/* CRM — finans (tahsilat / iade, alacaklar, müşteri bakiyeleri, özet) */
/* SP'ler: /sql/crm_finans.sql · API: /api/finans                      */
/* Kalan / ödeme durumu saklanmaz, view'lerde hesaplanır:              */
/*   Kalan = Satış toplamı (iptalse 0) − Σ Tahsilat + Σ İade           */
/* TL: alacak / bakiye satış kuruyla, tahsilat listesi ve "bu ay"      */
/* tahsilat günü kuruyla. Tarihler "yyyy-MM-dd".                       */
/* ------------------------------------------------------------------ */

import type { ParaBirimi } from "@/constants/data";
import type { CrmKisiTip, DbId } from "@/modules/crm/types/kisiler";
import type { SatisDurum, SatisTipi } from "@/modules/crm/types/satis";
import type { BelgePdfVeri } from "@/modules/crm/types/teklif";

export type { DbId };

/** 1 Tahsilat, 2 İade */
export type TahsilatTip = 1 | 2;

/** 1 Havale/EFT, 2 Kredi kartı, 3 Nakit, 4 Çek, 5 Diğer */
export type TahsilatOdemeSekli = 1 | 2 | 3 | 4 | 5;

/**
 * Satışın ödeme durumu (vCrmFinansSatis.OdemeDurumu).
 * 0 Ödenmedi, 1 Kısmi, 2 Ödendi (fazla ödeme dahil), 3 İade bekliyor
 * (iptal edilmiş ve net tahsilatı var). İptal + tahsilatsız satışta NULL.
 */
export type OdemeDurumu = 0 | 1 | 2 | 3;

/* ------------------------------------------------------------------ */
/* Satışlar sekmesi (rozet)                                            */
/* ------------------------------------------------------------------ */

/**
 * CrmFinans_SELECT_SatisTahsilat satırı. Tahsilatı olmayan satış listede
 * yoktur (TahsilEdilen = 0 kabul edilir); FE IDCrmSatis ile eşleştirir.
 */
export type CrmSatisTahsilatRow = {
  IDCrmSatis: DbId;
  /** Net (iadeler düşülmüş), satışın para biriminde. */
  TahsilEdilen: number;
  SonTahsilatTarihi: string | null;
};

/* ------------------------------------------------------------------ */
/* Alacaklar                                                           */
/* ------------------------------------------------------------------ */

/** vCrmFinansSatis satırı (CrmFinans_SELECT_Alacak). Tutarlar satışın para biriminde. */
export type CrmFinansSatisRow = {
  IDCrmSatis: DbId;
  IDSirket: DbId;
  IDCrmKisi: DbId;
  IDKullanici: DbId;
  SatisNo: string;
  SatisTipi: SatisTipi;
  Durum: SatisDurum;
  SatisTarihi: string;
  BaslangicTarihi: string | null;
  BitisTarihi: string | null;
  Konu: string;
  ParaBirimi: ParaBirimi;
  Kur: number;
  GenelToplam: number;
  /** Geçerli satışta GenelToplam, iptalde 0. */
  Borc: number;
  /** Net tahsil edilen (iadeler düşülmüş). */
  TahsilEdilen: number;
  /** Borc − TahsilEdilen. Eksi → fazla ödeme / iade bekleniyor. */
  Kalan: number;
  KalanTL: number;
  TahsilEdilenTL: number;
  OdemeDurumu: OdemeDurumu | null;
  /** Geçerli satışta tahsilat toplamı satışı aşmış. */
  FazlaOdeme: boolean;
  TahsilatSayisi: number;
  SonTahsilatTarihi: string | null;

  // Kişi
  KisiTip: CrmKisiTip;
  KisiAdi: string | null;
  CepTelefon: string | null;
  YetkiliKisiTel: string | null;
  YetkiliKisiEPostaAdresi: string | null;
};

export type CrmFinansAlacakFiltre = {
  /** Boş → tüm müşteriler. */
  IDCrmKisi?: DbId | null;
  /** Boş → hepsi. */
  OdemeDurumu?: OdemeDurumu | null;
  /**
   * true (varsayılan): kalanı olan geçerli satışlar + iade bekleyenler.
   * false: ödenmişler de gelir (iptal + tahsilatsız hariç).
   */
  SadeceAcik?: boolean;
};

/* ------------------------------------------------------------------ */
/* Müşteri bakiyeleri                                                  */
/* ------------------------------------------------------------------ */

/** vCrmFinansCari satırı (CrmFinans_SELECT_Cari). Tutarlar TL (satış kuruyla). */
export type CrmFinansCariRow = {
  IDCrmKisi: DbId;
  IDSirket: DbId;
  KisiTip: CrmKisiTip;
  /** Kişi pasif olabilir (tahsilatı olan kişi silinince pasife alınır). */
  KisiDurum: boolean;
  KisiAdi: string | null;
  CepTelefon: string | null;
  YetkiliKisiTel: string | null;
  YetkiliKisiEPostaAdresi: string | null;
  /** Geçerli satış sayısı. */
  SatisSayisi: number;
  /** Kalanı olan geçerli satış sayısı. */
  AcikSatisSayisi: number;
  ToplamSatisTL: number;
  /** İptal edilmiş satışların tahsilatları dahil, iadeler eksi. */
  ToplamTahsilatTL: number;
  /** ToplamSatisTL − ToplamTahsilatTL. Eksi → müşteriye iade borcu var. */
  BakiyeTL: number;
  TahsilatSayisi: number;
  SonTahsilatTarihi: string | null;
};

export type CrmFinansCariFiltre = {
  /** true → bakiyesi 0 olmayanlar. Varsayılan false. */
  SadeceBakiyeli?: boolean;
};

/* ------------------------------------------------------------------ */
/* Özet kartlar                                                        */
/* ------------------------------------------------------------------ */

/** CrmFinans_SELECT_Ozet (tek satır). */
export type CrmFinansOzet = {
  /** Geçerli satışların açık kalanı (TL, satış kuruyla). */
  ToplamAlacakTL: number;
  OdenmemisSatisSayisi: number;
  IadeBekleyenSayisi: number;
  /** Bu ayki net tahsilat (TL, tahsilat günü kuruyla). */
  BuAyTahsilatTL: number;
};

/* ------------------------------------------------------------------ */
/* Tahsilat                                                            */
/* ------------------------------------------------------------------ */

/** vCrmFinansTahsilat satırı (CrmTahsilat_SELECT, _SELECT_ByID). */
export type CrmTahsilatRow = {
  IDCrmTahsilat: DbId;
  IDSirket: DbId;
  IDCrmSatis: DbId;
  IDCrmKisi: DbId;
  IDKullanici: DbId;
  Tip: TahsilatTip;
  Tarih: string;
  /** Her zaman pozitif; yönü Tip belirler. */
  Tutar: number;
  /** İadede eksi. */
  IsaretliTutar: number;
  ParaBirimi: ParaBirimi;
  Kur: number;
  /** İşaretli, tahsilat günü kuruyla. */
  TutarTL: number;
  OdemeSekli: TahsilatOdemeSekli;
  FaturaNo: string | null;
  FaturaTarihi: string | null;
  Aciklama: string | null;
  OlusturmaTarihi: string;
  GuncellemeTarihi: string | null;

  // Satış
  SatisNo: string;
  SatisKonu: string;
  SatisDurum: SatisDurum;
  SatisToplam: number;

  // Kişi
  KisiTip: CrmKisiTip;
  KisiAdi: string | null;

  // Kaydı giren
  Ad: string | null;
  KullaniciAdi: string | null;
};

/**
 * INSERT / UPDATE ortak alanları. Tip ve OdemeSekli zorunlu: UPDATE SP'si
 * gönderilmeyeni 1'e çeker (iade düzeltilirken tahsilata dönmesin).
 */
export type CrmTahsilatAlanlari = {
  Tip: TahsilatTip;
  /** "yyyy-MM-dd" */
  Tarih: string;
  Tutar: number;
  /** Boş → INSERT'te satışın kuru, UPDATE'te mevcut kur. */
  Kur?: number | null;
  OdemeSekli: TahsilatOdemeSekli;
  FaturaNo?: string | null;
  FaturaTarihi?: string | null;
  Aciklama?: string | null;
};

/** INSERT. Kişi satıştan alınır. */
export type CrmTahsilatKaydetParams = CrmTahsilatAlanlari & {
  IDCrmSatis: DbId;
  /** Boş → satışın para birimi; farklıysa SP reddeder. */
  ParaBirimi?: ParaBirimi | null;
};

/** UPDATE. Satış ve para birimi değişmez. */
export type CrmTahsilatGuncelleParams = CrmTahsilatAlanlari & { IDCrmTahsilat: DbId };

export type CrmTahsilatInsertResponse = { IDCrmTahsilat: DbId | null };

export type CrmTahsilatListeFiltre = {
  /** Boş → hepsi. */
  IDCrmSatis?: DbId | null;
  /** Boş → hepsi. */
  IDCrmKisi?: DbId | null;
  /** "yyyy-MM-dd", dahil. */
  Baslangic?: string | null;
  Bitis?: string | null;
  /** Boş → tahsilat + iade. */
  Tip?: TahsilatTip | null;
};

/* ------------------------------------------------------------------ */
/* Hesap ekstresi (FE'de hesaplanır, lib/finans.ts → hesapEkstresi)    */
/* ------------------------------------------------------------------ */

/** Ekstrede bir hareket: satış borç, tahsilat alacak, iade borç yazar. */
export type EkstreHareket = {
  /** "yyyy-MM-dd" */
  Tarih: string;
  BelgeNo: string;
  Aciklama: string;
  Borc: number;
  Alacak: number;
  /** Bu satırdan sonraki bakiye (artı → müşteri borçlu). */
  Bakiye: number;
};

/**
 * Tek para biriminin ekstresi. Farklı para birimleri kurla birleştirilmez;
 * her biri ayrı tablo ve ayrı bakiyedir.
 */
export type EkstreHesap = {
  ParaBirimi: ParaBirimi;
  /** Dönem başlangıcından önceki hareketlerin bakiyesi ("tümü"nde 0). */
  Devreden: number;
  Hareketler: EkstreHareket[];
  ToplamBorc: number;
  ToplamAlacak: number;
  /** Dönem sonu bakiyesi = Devreden + ToplamBorc − ToplamAlacak. */
  Bakiye: number;
};

/** Hesap ekstresi PDF verisi (lib/teklif-pdf.tsx → ekstrePdfBlob). */
export type EkstrePdfVeri = {
  Kisi: BelgePdfVeri["Kisi"];
  /** "Tümü" / "01.01.2026 – 31.12.2026" */
  Donem: string;
  /** Devreden satırı gösterilsin mi (dönem başlangıcı varsa). */
  DevredenVar: boolean;
  /** Ekstrenin düzenlendiği gün, "yyyy-MM-dd". */
  Tarih: string;
  Hesaplar: EkstreHesap[];
};
