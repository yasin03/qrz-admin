// ---- PDKS Raporu (SELECT_RAPOR_PDKS) -------------------------------------

/** "" → tüm kayıtlar; diğerleri proc tarafında ilgili kayıtları süzer. */
export type PdksRaporIslem =
  "" | "GEÇGİRİŞ" | "GEÇÇIKIŞ" | "MESAİ" | "DEVAMSIZ";

export type PdksRaporSelectRequestType = {
  IDSube: string | number;
  /** 0 → tüm bölümler */
  IDBolum: string | number;
  /** 0 → tüm personel */
  IDSubePersonel: string | number;
  /** "yyyy-MM-dd" */
  Tarih1: string;
  /** "yyyy-MM-dd" */
  Tarih2: string;
  Islem: PdksRaporIslem;
};

export type PdksRaporResponseType = {
  IDSubePersonelSaat: string | number;
  IDBolum: string | number;
  IDSubePersonel: string | number;
  AdSoyad: string;
  /** "dd.MM.yyyy" */
  Tarih: string;
  Giris: string | null;
  Cikis: string | null;
  NormalSure: string | null;
  MesaiSure: string | null;
  IzinSure: string | null;
  ToplamSure: string | null;
  Cinsiyet: string | null;
  IDKullanici: string | number;
};

// Filtre ekranının tuttuğu değerler; IDSube context'ten ekleniyor.
export type PdksRaporFilters = Omit<PdksRaporSelectRequestType, "IDSube">;

// ---- Avans / İzin Raporları ----------------------------------------------
// Şirket/şube sayfadaki filtreden gelir; IDSube "0" → tüm şubeler.

type RaporSirketSubeParams = {
  IDSirket: string;
  IDSube: string;
};

export type AvansRaporSelectRequestType = RaporSirketSubeParams & {
  /** "yyyy-MM-dd" */
  BaslangicTarihi: string;
  /** "yyyy-MM-dd" */
  BitisTarihi: string;
};

export type AvansRaporResponseType = {
  IDSubePersonelAvans: string;
  IDSubePersonel: string;
  EvrakNo: string | null;
  SubeKodu: string | null;
  TcKimlikNo: string | null;
  AdSoyad: string | null;
  /** "dd.MM.yyyy" */
  KesintiTarihi2: string | null;
  Tutar: number | null;
  Aciklama: string | null;
  /** "dd.MM.yyyy" */
  OdemeBaslangicTarihi: string | null;
  BordroKesintiTutari: number | null;
};

export type IzinRaporTuru = "genel" | "yillik";

/** Rapor filtrelerindeki tarih aralığı ("yyyy-MM-dd") */
export type RaporTarihFilters = {
  BaslangicTarihi: string;
  BitisTarihi: string;
};

export type AvansRaporFilters = RaporTarihFilters;

export type IzinRaporFilters = RaporTarihFilters & {
  raporTuru: IzinRaporTuru;
  CikisVar: boolean;
};

export type IzinRaporGenelSelectRequestType = RaporSirketSubeParams & {
  /** "yyyy-MM-dd" */
  BaslangicTarihi: string;
  /** "yyyy-MM-dd" */
  BitisTarihi: string;
  /** "0" → tüm izin türleri */
  Aciklama: string;
  CikisVar: boolean;
};

export type IzinRaporYillikSelectRequestType = RaporSirketSubeParams & {
  Yil: string;
  /** "yyyy-MM-dd" */
  BitisTarihi: string;
  CikisVar: boolean;
};

/** Tarih alanları ISO string ("2026-01-08T00:00:00.000Z") */
export type IzinRaporGenelResponseType = {
  IDIzinGenel: string;
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  IDSirket: string;
  SicilNo: string | null;
  TcKimlikNo: string | null;
  Ad: string | null;
  Soyad: string | null;
  AdSoyad: string | null;
  SubeKodu: string | null;
  BolumAdi: string | null;
  BaslangicTarihi: string | null;
  BitisTarihi: string | null;
  Aciklama: string | null;
  Gun: number | null;
  AitOlduguYil: string | null;
  IseIlkGirisTarihi: string | null;
  IseSonGirisTarihi: string | null;
  Durum: boolean;
  CikisTarihi: string | null;
};

/** Tarih alanları ISO string ("2026-01-08T00:00:00.000Z") */
export type IzinRaporYillikResponseType = {
  IDSubePersonel: string;
  SubeKodu: string | null;
  TcKimlikNo: string | null;
  AdSoyad: string | null;
  KidemYil: number | null;
  Yas: number | null;
  IseIlkGirisTarihi: string | null;
  CikisTarihi: string | null;
  DogumTarihi: string | null;
  ToplamIzinHakki: number | null;
  KullanilanIzin: number | null;
  /** Geçmiş yıllarda kullanılan izin */
  oKullanilanIzin: number | null;
  ToplamKullanilanIzin: number | null;
  ToplamKalanIzin: number | null;
};
