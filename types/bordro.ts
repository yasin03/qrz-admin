export type BordroSelectRequestType = {
  IDSube: string | number;
  IDBolum: string | number;
  Yil: string;
  Ay: string;
  Adi: string;
  TcKimlikNo: string;
};

export type BordroResponseType = {
  IDSube: string;
  IDSirket: string;
  SubeAdi: string;
  SubeKodu: string;
  IDSubePersonel: string;
  IDBolum: string;
  SicilNo: string;
  TcKimlikNo: string;

  Ad: string;
  Soyad: string;
  AdSoyad: string;

  IseSonGirisTarihi: string;
  IseSonGirisTarihi2: string;
  CikisTarihi: string | null;
  CikisTarihi2: string | null;

  IDBordro: string;
  Yil: string;
  Ay: string;

  ToplamGun: number | null;
  ToplamHT: number | null;
  ToplamGT: number | null;
  ToplamYI: number | null;
  ToplamYK: number | null;
  ToplamDG: number | null;
  Toplam: number | null;

  SgkDurumu: string;
  OdemeSekli: string;
  UcretTipi: string;
  Ucret: number;

  AgiAlmazDurumu: boolean | null;
  BesKesilmezDurumu: boolean | null;
  AgiOrani: number | null;
  BesOrani: number | null;

  GunSayisi: number | null;
  SgkGunSayisi: number | null;
  BrutToplamGun: number | null;
  SaatSayisi: number | null;
  BrutSaatSayisi: number | null;

  BrutToplamGT: number | null;
  BrutToplamHT: number | null;
  BrutToplamYI: number | null;

  ToplamYemek: number | null;
  BrutToplamYemek: number | null;
  ToplamYol: number | null;
  BrutToplamYol: number | null;
  BrutToplamOdemeler: number | null;

  SgkMatrahi: number | null;
  SgkIsciPrimi: number | null;
  SgkIsverenPrimi: number | null;
  SgkIssizIsciPrimi: number | null;
  SgkIssizIsverenPrimi: number | null;

  KumulatifVergiMatrahi: number | null;
  VergiMatrahi: number | null;
  DamgaVergisi: number | null;
  YasalKesintilerToplami: number | null;

  Agi: number | null;
  AgiDahilToplamNet: number | null;

  Tesvik5510: number | null;
  Tesvik4447: number | null;
  Tesvik: number | null;
  ToplamMaliyet: number | null;

  KesintilerToplami: number | null;
  Bes: number | null;

  ToplamFMs100: number | null;
  BrutToplamFMs100: number | null;
  ToplamFMs50: number | null;
  BrutToplamFMs50: number | null;

  ToplamFMg100: number | null;
  BrutToplamFMg100: number | null;
  ToplamFMg50: number | null;
  BrutToplamFMg50: number | null;

  ToplamDMs: number | null;
  BrutToplamDMs: number | null;
  ToplamDMg: number | null;
  BrutToplamDMg: number | null;

  ToplamRMs: number | null;
  BrutToplamRMs: number | null;
  ToplamRMg: number | null;
  BrutToplamRMg: number | null;

  ToplamTisFMs: number | null;
  BrutToplamTisFMs: number | null;
  ToplamTisFMg: number | null;
  BrutToplamTisFMg: number | null;

  ToplamTisDMs: number | null;
  BrutToplamTisDMs: number | null;
  ToplamTisDMg: number | null;
  BrutToplamTisDMg: number | null;

  ToplamTisRMs: number | null;
  BrutToplamTisRMs: number | null;
  ToplamTisRMg: number | null;
  BrutToplamTisRMg: number | null;

  SendikaKesintisi: number | null;
  AvansKesintisi: number | null;
  IcraKesintisi: number | null;
  NafakaKesintisi: number | null;
  TelefonKesintisi: number | null;
  EgitimKesintisi: number | null;
  TrafikKesintisi: number | null;
  HasarKesintisi: number | null;
  FazlaOdemeKesintisi: number | null;
  SayistayKesintisi: number | null;
  MuhtelifKesintisi: number | null;
  YevmiyeKesintisi: number | null;
  DayanismaKesintisi: number | null;
  LojmanKesintisi: number | null;
  GecmisDonemOdemeKesintisi: number | null;

  AskerlikYardimi: number | null;
  BayramOdenegi: number | null;
  EgitimUcreti: number | null;
  EkdersUcreti: number | null;
  IkramiyeOdenegi: number | null;
  EvlilikYardimi: number | null;
  MaasFarki: number | null;
  OgrenimYardimi: number | null;
  OlumYardimi: number | null;
  SilahTazminati: number | null;
  TeftisFazlaMesai: number | null;
  YakacakYardimi: number | null;

  NetOdenen: number | null;
  OdenecekTutar: number | null;
  VergiIndirimi: number | null;

  BrutGunOdemeler: number | null;
  BrutMesaiOdemeler: number | null;
  BrutToplamYolYemek: number | null;
  BrutYardimOdemeler: number | null;

  PersonelIndirimi: number | null;
  GelirVergisi: number | null;
  IndirimSonrasiVergiMatrahi: number | null;

  SendikaDurumu: boolean;
  AgiHaricToplamNet: number | null;

  CocukYardimi: number | null;
  KalanIcraKesintisi: number | null;

  HesaplamaTarihi: string | null;
  HesaplamaTarihi2: string | null;
  OnayTarihi: string | null;

  IlaveAgi: number | null;
  ToplamDiger: number | null;
  ArabulucuYardimi: number | null;
  PostaPuluKesintisi: number | null;
  DisiplinKesintisi: number | null;

  ToplamTisGeceMg: number | null;
  BrutToplamTisGeceMg: number | null;
  ToplamTisGeceMs: number | null;
  BrutToplamTisGeceMs: number | null;

  SgkEksikGun: number | null;
  ToplamEmekGun: number | null;
  HastalikRiskYardimi: number | null;
  IstisnaEksikGun: number | null;
  BrutIstisnaEksikGun: number | null;

  KucukCocukYardimi: number | null;
  BuyukCocukYardimi: number | null;

  PersonelAyrilisKodu: string;
  IlkSoyad: string;
  Bos: string | null;
  Durum: boolean;

  KodSektor: string | null;
  KodIsKolu: string | null;
  KodYSube: string | null;
  KodESube: string | null;
  KodSiraNo: string | null;
  KodIl: string | null;
  KodIlce: string | null;
  KodKontrolNo: string | null;
  KodAraci: string | null;

  IsyeriSgkSicilNumarasi: string | null;

  VergidenMuaf: boolean;
  OzurlulukDerecesi: number;
  PersonelMeslekKodu: string;
  PersonelSgkBelgeTuru: string;
  PersonelKanunNo: string;

  AileYardimi: number | null;
  KasaTazminati: number | null;
  IsRiskiYardimi: number | null;
  CesitliOdemelerYardimi: number | null;

  FazlaKesilenBesTutari: number | null;
  EksikKesilenBesKesintisi: number | null;

  Cinsiyet: string;
  EkdersSaat: number | null;

  YillikIzinYardimi: number | null;
  KidemTazminati: number | null;
  IhbarTazminati: number | null;
  PrimOdemeYardimi: number | null;
  EkMenfaatYardimi: number | null;

  YolUcreti: number | null;
  KresYardimi: number | null;

  SicilSektor: string | null;
  SicilIsKolu: string | null;
  SicilYSube: string | null;
  SicilESube: string | null;
  SicilSiraNo: string | null;
  SicilIl: string | null;
  SicilIlce: string | null;
  SicilKontrol: string | null;
  SicilAraci: string | null;

  NetMesaiOdemeler: number | null;
  KresKesintisi: number | null;

  NetUcret: number;
  NetUcret2: number;

  BolumAdi: string;
  IsAvansiKesintisi: number | null;

  GorevAdi: string;
  UnvanAdi: string;

  GunlukUcret: number;
  VergiMuafiyeti: number | null;
  SskMuafiyeti: number | null;
  SaatlikUcret: number;

  AsgeriUcretli: boolean;

  IsyeriTuru: string | null;
  IsyeriSubeKodu: string | null;

  DamgaVergisiIstisnasi: number | null;
  DamgaVergisiMatrahi: number | null;

  AuKumulatifVergiMatrahi: number | null;
  AuDevredenKumulatifVergiMatrahi: number | null;
  AuGelirVergisiMatrahi: number | null;
  AuGelirVergisi: number | null;
  GelirVergisiFarki: number | null;

  SgkIstisnasi: number | null;
  IstisnaDamgaVergisi: number | null;
  IstisnaGelirVergisi: number | null;
  DamgaVergisiFarki: number | null;

  YemekUcreti: number | null;
  FarkBrutYemek: number | null;
  FarkBrutYemekSgkMuafiyet: number | null;
  FarkBrutYemekVergiMuafiyet: number | null;
  FarkBrutYardim: number | null;
};

export type BordroHesaplaRequestType = {
  IDSube: string | number;
  IDSubePersonelList: string; // "40" | "40-34-65" | tüm personel id'leri birleşik
  Yil: string;
  Ay: string;
};

export type BordroHesapSilRequestType = BordroHesaplaRequestType;

export type BordroOnayRequestType = {
  IDSube: string | number;
  IDSubePersonelList: string;
  Yil: string;
  Ay: string;
  OnayDurum: boolean;
};