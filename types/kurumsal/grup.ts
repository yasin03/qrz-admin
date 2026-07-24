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
  GrupAdi: string;
  YetkiliKisi: string;
  Tel: string;
  IsTel?: string;
  Durum: 0 | 1;
  SadeceSirketYetkisi: 0 | 1;
  SirketSayisi: number;
}

export interface UpdateGrupRequest {
  IDGurup: number;

  GrupAdi: string;
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


export interface GrupKullanici {
  IDKullanici: number;
  AdSoyad: string;
  Eposta: string;
  IDGurup: number;
  GrupAdi: string;
  Durum: 0 | 1;
}
