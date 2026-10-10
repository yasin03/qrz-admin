export interface GrupType {
  IDGurup: number;
  GurupAdi: string;
  YetkiliKisi: string;
  IsTel: string;
  Tel: string;
  IDKullanici: number;
  Durum: 0 | 1;
  CreatedDate: string;
  SadeceSirketYetkisi: 0 | 1;
  SirketSayisi: number;
}

export interface CreateGrupRequest {
  IDGurup?: number;
  GurupAdi: string;
  YetkiliKisi: string;
  Tel: string;
  IsTel?: string;
  Durum: 0 | 1;
  SadeceSirketYetkisi: 0 | 1;
  SirketSayisi: number;
}

export interface UpdateGrupRequest {
  IDGurup: number;

  GurupAdi: string;
  YetkiliKisi: string;
  Tel: string;
  IsTel?: string;
  Durum: 0 | 1;
  SadeceSirketYetkisi: 0 | 1;
  SirketSayisi: number;
}

export interface DeleteGrupRequest {
  IDGurup: number;
}

export interface AktifPasifGrupRequest {
  IDGurup: number;
  /** Grubun YENİ durumu: 1 = aktif, 0 = pasif */
  Durum: 0 | 1;
}

export interface GrupKullanici {
  IDKullanici: number;
  AdSoyad: string;
  Eposta: string;
  IDGurup: number;
  GrupAdi: string;
  Durum: 0 | 1;
}
