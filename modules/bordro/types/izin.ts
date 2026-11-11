export type IzinType = {
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  SicilNo: string;
  TcKimlikNo: string;
  Ad: string;
  Soyad: string;
  IDIzinGenel: string;
  BaslangicTarihi: string;
  BitisTarihi: string;
  Aciklama: string;
  Gun: number;
  AitOlduguYil: string;
  IDSirket: string;
  SubeKodu: string;
  IseIlkGirisTarihi: string;
  IseSonGirisTarihi: string;
  Durum: boolean;
  CikisTarihi: string | null;
  BolumAdi: string;
};

export type IzinTipi = {
  value: string;
  label: string;
};

/** Sayfadaki filtre state'i. Aciklama boşsa "tümü" anlamına gelir. */
export type IzinFilters = {
  BaslangicTarihi: string; // "yyyy-MM-dd"
  BitisTarihi: string; // "yyyy-MM-dd"
  Aciklama: string;
};

export type IzinSelectParams = {
  IDSubePersonel: string; // yönetici/admin -> "0", personel -> kendi id'si
  BaslangicTarihi: string;
  BitisTarihi: string;
  Aciklama: string;
};

export type IzinDeleteParams = {
  IDIzinGenel: string;
};

export type IzinInsertParams = {
  IDSubePersonel: string; // "40-25-32" formatında, "-" ile birleşik
  BaslangicTarihi: string;
  BitisTarihi: string;
  Gun: string;
  Aciklama: string; // izin tipinin label değeri
  AitOlduguYil: string; // default "0"
  CizelgeDurum: string; // default "0"
};

export type IzinTalepType = {
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  SicilNo: string;
  TcKimlikNo: string;
  Ad: string;
  Soyad: string;
  AdSoyad: string;
  IDSubePersonelIzinTalep: string;
  BaslangicTarihi: string;
  BitisTarihi: string;
  Aciklama: string;
  Gun: number;
  AitOlduguYil: string;
  Adres: string;
  Telefon: string;
  OnayDurum: boolean;
  RedDurum: boolean;
  Tarih: string;
  Dosyalar: string;
  SubeAdi: string;
  Mesaj: string;
  RedAciklama: string | null;
};

export type IzinTalepSelectParams = {
  IDSube: string;
  IDSubePersonel: string; // personel -> kendi id'si, admin/yönetici -> "0"
  BaslangicTarihi: string;
  BitisTarihi: string;
};

export type IzinTalepInsertParams = {
  IDSubePersonel: string;
  BaslangicTarihi: string;
  BitisTarihi: string;
  Gun: string;
  Aciklama: string; // izin tipinin "Kod" (label) değeri
  AitOlduguYil: string; // default "0"
  Adres: string;
  Mesaj: string;
  Dosyalar: string; // base64
};

export type IzinSureParams = {
  IDSubePersonel: string;
  Tarih: string; // "yyyy-MM-dd", her zaman bugünün tarihi
};

/** GET_IZINSURE (SubePersonelIzin_HESAPLAByIDSubePersonel) yanıtı */
export type IzinSureType = {
  IzinKidemYili: number;
  ToplamIzinHakki: number;
  KullanilanIzin: number;
  oKullanilanIzin: number;
  ToplamKullanilanIzin: number;
  ToplamKalanIzin: number;
  Adres: string;
  Telefon: string;
};

export type IzinTalepUpdateParams = {
  IDSubePersonelIzinTalep: string;
  IDKullanici: string;
  KabulRed: string; // "1" = Onay, "2" = Red — backend değerleri netleşince güncellenebilir
  RedAciklama: string;
};