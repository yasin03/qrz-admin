export interface SubeType {
  IDSirket: number;

  SubeAdi: string;
  SubeKodu: string;

  YetkiliKisi: string;
  TcKimlikNo: string;

  Tel: string;
  CepTel: string;
  Fax: string;

  EpostaAdresi: string;
  WebAdresi: string;

  SirketAdresi: string;

  IlKodu: string;
  IlceKodu: string;

  IsyeriSgkSicilNumarasi: string;
  TicaretSicilNumarasi: string;
  SgkMudurlugu: string;

  IsyeriAcilisTarihi: string;
  IsyeriKapanisTarihi: string;

  IskurSubesi: string;
  IskurNumarasi: string;
  IskurSifresi: string;

  BesBaslangicTarihi: string;
  BesKesintiOrani: number | null;

  SifreKullaniciAdi: string;
  SifreKullaniciKodu: string;
  SifreSistem: string;
  SifreIsyeri: string;

  IsyeriSgkIsKoluKodu: string;

  VergiDairesi: string;
  VergiNo: string;

  IsyeriTehlikeSinifi: string;
  TehlikeDerecesi: string;

  NaceKodu: string;
  NaceKoduAciklama: string;

  Durum: 0 | 1;

  KodSektor: string;
  KodIsKolu: string;
  KodYSube: string;
  KodESube: string;
  KodSiraNo: string;
  KodIl: string;
  KodIlce: string;
  KodKontrolNo: string;
  KodAraci: string;

  IskurBaslangicTarihi: string | null;
  IskurBitisTarihi: string | null;

  Statu: string;
  TesvikVermeDurumu: 0 | 1;
  StopajDurum: 0 | 1;

  stIsyeriAdi: string;
  stAd: string;
  stSoyad: string;
  stVergiNo: string;
  stTcKimlikNo: string;
  stUcretTipi: string;
  stUcret: number | null;
  stAdresKodu: string;

  MulkiyetTuru: string;
  TicaretSicilMudurluk: string;
  IsyeriFaaliyetKodu: string;
  AdresKodu: string;

  Cizelge15: string;

  MuhasebeBirimKodu: string;
  MuhasebeBirimAdi: string;

  KurumKodu: string;
  KurumAdi: string;

  SinifKodu: string;

  DuzenleyenAdSoyad: string;
  DuzenleyenUnvan: string;

  GerceklestirenAdSoyad: string;
  GerceklestirenUnvan: string;

  IsyeriSubeKodu: string;
  IsyeriTuru: string;

  BankaKurumKodu: string;
  BankaSubeKodu: string;
  BankaHesapNo: string;
  BankaIbanNo: string;
  IDBanka: string;

  IDKullanici: number;
}