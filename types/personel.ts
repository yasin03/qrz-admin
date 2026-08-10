export interface PersonelType {
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;

  SicilNo: string;
  TcKimlikNo: string;
  Ad: string;
  Soyad: string;
  IlkSoyad: string | null;
  Cinsiyet: string;
  DogumTarihi: string | null;
  DogumYeri: string | null;
  MedeniDurum: string | null;
  Uyruk: string | null;
  KanGurubu: string | null;
  IseIlkGirisTarihi: string | null;
  IseSonGirisTarihi: string | null;
  SgkDurumu: number | null;
  IstihdamDurumu: number | null;
  PersonelMeslekKodu: string | null;
  PersonelSgkBelgeTuru: string | null;
  PersonelKanunNo: string | null;
  PersonelGorevKodu: number | null;
  CalismaDurumu: number;
  Ucret: number | null;
  MaasParaBirimi: number | null;
  OdemeSekli: number | null;
  UcretTipi: number | null;
  OgrenimDurumu: number | null;
  MezuniyetYili: string | null;
  MezuniyetBolumu: string | null;
  IDBanka: number | null;
  BankaSubeKodu: string | null;
  BankaHesapNo: string | null;
  BankaIbanNo: string | null;
  IDLokasyon: string | null;
  CikisTarihi: string | null;
  PersonelAyrilisKodu: string | null;
  AgiAlmazDurumu: boolean;
  BesKesilmezDurumu: boolean;
  EskiHukumluDurumu: boolean;
  OzurluDurumu: boolean;
  AzCalismaDurumu: boolean;
  AgiOrani: number | null;
  BesOrani: number | null;
  DevredenSgkMatrahi: number | null;
  KumulatifSgkMatrahi: number | null;
  Telefon: string | null;
  Adres: string | null;
  Aciklama: string | null;
  CalismaAlani: string | null;
  Koordinatorluk: string | null;
  OzurlulukDerecesi: number | null;
  SendikaDurumu: boolean;
  GorevAdi: string | null;
  UnvanAdi: string | null;
  OzelKod: string | null;
  OzelKod2: string | null;
  Fotograf: string | null;
  AzCalismaDurumuGun: boolean;
  AzCalismaDurumuGunSayisi: number | null;
  IDPersonelIstisnaDurum: number | null;
  IstisnaDurumBilgi: string | null;
  IstisnaDurumTarih: string | null;
  PersonelSigortaKolu: string | null;
  IskurKayit: boolean;
  IskurKayitNo: string | null;
  Boy: number | null;
  Kilo: number | null;
  Yas: number | null;
  KimlikKartiDuzenlemeTarihi: string | null;
  KimlikKartiBitisTarihi: string | null;
  KimlikKartiSeriNo: string | null;
  GunlukUcret: number | null;
  SaatlikUcret: number | null;
  SozlesmeUcret: number | null;
  SozlesmeOdemeSekli: number | null;
  SozlesmeUcret2: number | null;
  SozlesmeOdemeSekli2: number | null;
  Ucret2: number | null;
  GunlukUcret2: number | null;
  SaatlikUcret2: number | null;
  DayanismaDurumu: boolean;
  AsgeriUcretli: boolean;
  HastalikRiskPrimDurumu: boolean;
  AgiOranID: number | null;
  SendikaBaslangicTarihi: string | null;
  DayanismaBaslangicTarihi: string | null;
  TesvikOrani: number | null;
  VergidenMuaf: boolean;
  NetUcret: number | null;
  YardimHaric: boolean;
  AgiHaric: boolean;
  IlKodu: string | null;
  IlceKodu: string | null;
  MaliMesuliyet: boolean;
  CocukYardimiAlamaz: boolean;
  BordroIstisnaUygulama: boolean;
  Durum: boolean;
  AuKumulatifVergiMatrahi: number | null;
  UcretOtomatikIsle: boolean;
  UcretOdemeGun: number | null;
  GecmistenKalanIzinGun: number | null;
  VardiyaliCalismaDurumu: boolean;
}

// Liste proc'unun (SubePersonel_SELECTByTarih) döndürdüğü, tabloda
// kullandığımız daha dar alan seti. Gerçek kolonları paylaşırsan
// kesinleştiririz — şimdilik Personel.tsx'teki columns tanımına göre.
export interface PersonelListItem {
  IDSubePersonel: string;
  SicilNo: string;
  AdSoyad: string;
  CalismaDurumu: string;
  Ucret: number;
  OdemeSekli: string;
  UcretTipi: string;
  IseSonGirisTarihi: string | null;
  Cinsiyet: string;
  Durum: boolean;
}

export interface DeletePersonelRequest {
  IDSubePersonel: string;
}
