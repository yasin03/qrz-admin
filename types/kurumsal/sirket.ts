export interface SirketType {
  IDSirket: number;
  IDFirma: number;
  IDGurup: number;

  SirketAdi: string;
  YetkiliKisi: string;

  Adi: string | null;
  Soyadi: string | null;
  TcKimlikNo: string | null;

  VergiDairesi: string;
  VergiNo: string;

  Tel: string | null;
  CepTel: string | null;
  Fax: string | null;

  EpostaAdresi: string | null;
  WebAdresi: string | null;

  SirketAdresi: string;

  Ulke: string;
  IlKodu: string;
  IlceKodu: string;
  PostaKodu: string;

  IsyeriSgkSicilNumarasi: string | null;
  IsyeriSgkIsKoluKodu: string | null;

  TicaretSicilNumarasi: string | null;
  MersisNumarasi: string | null;

  IskurSubesi: string | null;
  IskurNumarasi: string | null;

  IsyeriAcilisTarihi: string;
  IsyeriKapanisTarihi: string;

  Durum: number;

  MulkiyetTuru: string;
  TicaretSicilMudurluk: string | null;
  IsyeriFaaliyetKodu: string | null;

  AdresKodu: string;

  SirketTip: string;

  ServisPassword: string | null;
  ServisAktif: number | null;

  IDKullanici: string;
}

export interface CreateSirketType {
  IDSirket: number;
  IDFirma: number;
  IDGurup: number;

  SirketAdi: string;
  YetkiliKisi: string;

  Adi: string | null;
  Soyadi: string | null;
  TcKimlikNo: string | null;

  VergiDairesi: string;
  VergiNo: string;

  Tel: string | null;
  CepTel: string | null;
  Fax: string | null;

  EpostaAdresi: string | null;
  WebAdresi: string | null;

  SirketAdresi: string;

  Ulke: string;
  IlKodu: string;
  IlceKodu: string;
  PostaKodu: string;

  IsyeriSgkSicilNumarasi: string | null;
  IsyeriSgkIsKoluKodu: string | null;

  TicaretSicilNumarasi: string | null;
  MersisNumarasi: string | null;

  IskurSubesi: string | null;
  IskurNumarasi: string | null;

  IsyeriAcilisTarihi: string;
  IsyeriKapanisTarihi: string;

  Durum: number;

  MulkiyetTuru: string;
  TicaretSicilMudurluk: string | null;
  IsyeriFaaliyetKodu: string | null;

  AdresKodu: string;

  SirketTip: string;

  ServisPassword: string | null;
  ServisAktif: number | null;

  IDKullanici: string;
}

export interface UpdateSirketType {
  IDSirket: number;
  IDFirma: number;
  IDGurup: number;

  SirketAdi: string;
  YetkiliKisi: string;

  Adi: string | null;
  Soyadi: string | null;
  TcKimlikNo: string | null;

  VergiDairesi: string;
  VergiNo: string;

  Tel: string | null;
  CepTel: string | null;
  Fax: string | null;

  EpostaAdresi: string | null;
  WebAdresi: string | null;

  SirketAdresi: string;

  Ulke: string;
  IlKodu: string;
  IlceKodu: string;
  PostaKodu: string;

  IsyeriSgkSicilNumarasi: string | null;
  IsyeriSgkIsKoluKodu: string | null;

  TicaretSicilNumarasi: string | null;
  MersisNumarasi: string | null;

  IskurSubesi: string | null;
  IskurNumarasi: string | null;

  IsyeriAcilisTarihi: string;
  IsyeriKapanisTarihi: string;

  Durum: number;

  MulkiyetTuru: string;
  TicaretSicilMudurluk: string | null;
  IsyeriFaaliyetKodu: string | null;

  AdresKodu: string;

  SirketTip: string;

  ServisPassword: string | null;
  ServisAktif: number | null;

  IDKullanici: string;
}

export interface DeleteSirketType {
  IDSirket: number;
}
