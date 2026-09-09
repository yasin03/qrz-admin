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
