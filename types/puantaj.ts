export type PuantajSelectRequestType = {
  IDSube: string | number;
  IDBolum: string | number;
  Yil: string;
  Ay: string;
  Adi: string;
  TcKimlikNo: string;
};

export type PuantajUpdateRequestType = {
  IDSubePersonel: string | number;
  Yil: string;
  Ay: string;
  Gun: string;
  Saat: string;
  Tur: string;
};

export type PuantajDeleteRequestType = {
  IDSube: string | number;
  IDBolum: string | number;
  Yil: string;
  Ay: string;
  List: string;
};

export type PuantajSelectResponseType = {
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  SicilNo: string;
  TcKimlikNo: string;
  Ad: string;
  Soyad: string;
  Yil: string;
  Ay: string;

  G1: string | null;
  G2: string | null;
  G3: string | null;
  G4: string | null;
  G5: string | null;
  G6: string | null;
  G7: string | null;
  G8: string | null;
  G9: string | null;
  G10: string | null;
  G11: string | null;
  G12: string | null;
  G13: string | null;
  G14: string | null;
  G15: string | null;
  G16: string | null;
  G17: string | null;
  G18: string | null;
  G19: string | null;
  G20: string | null;
  G21: string | null;
  G22: string | null;
  G23: string | null;
  G24: string | null;
  G25: string | null;
  G26: string | null;
  G27: string | null;
  G28: string | null;
  G29: string | null;
  G30: string | null;
  G31: string | null;

  ToplamSaat: string | null;
  ToplamGun: string | null;
  ToplamHT: string | null;
  ToplamGT: string | null;
  ToplamVI: string | null;
  ToplamYI: string | null;
  ToplamEI: string | null;
  ToplamDI: string | null;
  ToplamCI: string | null;
  ToplamRP: string | null;
  ToplamUI: string | null;
  ToplamYK: string | null;
  ToplamFM: string | null;
  ToplamRM: string | null;
  ToplamDM: string | null;

  GunSayisi: string | null;
  SgkGunSayisi: string | null;

  Durum: boolean;

  IDUcretCizelgesi: string;

  ToplamYemek: string | null;
  ToplamYol: string | null;

  IseSonGirisTarihi: string | null;
  CikisTarihi: string | null;

  SendikaDurumu: boolean;
  OdemeSekli: string;

  ToplamFMG: string | null;
  ToplamRMG: string | null;
  ToplamDMG: string | null;
  ToplamTisFM: string | null;
  ToplamTisFMG: string | null;
  ToplamDiger: string | null;
  SgkEksikGun: string | null;
  ToplamTisGs: string | null;
  ToplamTisGg: string | null;
  ToplamMI: string | null;
  Bos: string | null;

  UnvanAdi: string;
  OnayTarihi: string | null;
  IstihdamDurumu: number;
  BolumAdi: string;
  OdemeGun: string | null;
  AdSoyad: string;

  IseSonGirisTarihi2: string;
  CikisTarihi2: string | null;
  UnvanAdi2: string;
  SendikaDurumu2: string;
  Onay: string;
};
