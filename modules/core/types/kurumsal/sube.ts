// /types/kurumsal/sube.ts

export interface SubeType {
  IDSube: number;
  IDSirket: number;

  SubeAdi: string;
  SubeKodu: string | null;

  YetkiliKisi: string | null;
  TcKimlikNo: string | null;

  Tel: string | null;
  CepTel: string | null;
  Fax: string | null;
  EpostaAdresi: string | null;
  WebAdresi: string | null;

  SirketAdresi: string | null;
  Ulke : string | null;
  IlKodu: string | null;
  IlceKodu: string | null;

  IsyeriSgkSicilNumarasi: string | null;
  TicaretSicilNumarasi: string | null;
  SgkMudurlugu: string | null;

  IsyeriAcilisTarihi: string | null;
  IsyeriKapanisTarihi: string | null;

  IskurSubesi: string | null;
  IskurNumarasi: string | null;
  IskurSifresi: string | null;

  BesBaslangicTarihi: string | null;
  BesKesintiOrani: number | null;

  SifreKullaniciAdi: string | null;
  SifreKullaniciKodu: string | null;
  SifreSistem: string | null;
  SifreIsyeri: string | null;

  IsyeriSgkIsKoluKodu: string | null;

  VergiDairesi: string | null;
  VergiNo: string | null;

  IsyeriTehlikeSinifi: string | null;
  TehlikeDerecesi: string | null;

  NaceKodu: string | null;
  NaceKoduAciklama: string | null;

  Durum: number;

  KodSektor: string | null;
  KodIsKolu: string | null;
  KodYSube: string | null;
  KodESube: string | null;
  KodSiraNo: string | null;
  KodIl: string | null;
  KodIlce: string | null;
  KodKontrolNo: string | null;
  KodAraci: string | null;

  IskurBaslangicTarihi: string | null;
  IskurBitisTarihi: string | null;

  Statu: string | null;
  TesvikVermeDurumu: number;
  StopajDurum: number;

  stIsyeriAdi: string | null;
  stAd: string | null;
  stSoyad: string | null;
  stVergiNo: string | null;
  stTcKimlikNo: string | null;
  stUcretTipi: string | null;
  stUcret: number | null;
  stAdresKodu: string | null;

  MulkiyetTuru: string | null;
  TicaretSicilMudurluk: string | null;
  IsyeriFaaliyetKodu: string | null;
  AdresKodu: string | null;

  Cizelge15: string | null;

  MuhasebeBirimKodu: string | null;
  MuhasebeBirimAdi: string | null;
  KurumKodu: string | null;
  KurumAdi: string | null;
  SinifKodu: string | null;

  DuzenleyenAdSoyad: string | null;
  DuzenleyenUnvan: string | null;
  GerceklestirenAdSoyad: string | null;
  GerceklestirenUnvan: string | null;

  IsyeriSubeKodu: string | null;
  IsyeriTuru: string | null;

  BankaKurumKodu: string | null;
  BankaSubeKodu: string | null;
  BankaHesapNo: string | null;
  BankaIbanNo: string | null;
  IDBanka: string | null;

  CreatedDate: string;
  IDKullanici: string;
}

// Create/Update — IDSube (update'te) ve IDKullanici (session'dan enjekte
// edilir) dışında SubeType ile birebir aynı alanlar.
export type CreateSubeRequest = Omit<SubeType, "IDSube" | "CreatedDate" | "IDKullanici"> & {
  IDKullanici?: string; // route tarafında session'dan doldurulur, client göndermek zorunda değil
};

export type UpdateSubeRequest = CreateSubeRequest & {
  IDSube: number;
};

export interface DeleteSubeRequest {
  IDSube: number;
}