// ---- PDKS Raporu (SELECT_RAPOR_PDKS) -------------------------------------

/** "" → tüm kayıtlar; diğerleri proc tarafında ilgili kayıtları süzer. */
export type PdksRaporIslem =
  | ""
  | "GEÇGİRİŞ"
  | "GEÇÇIKIŞ"
  | "MESAİ"
  | "DEVAMSIZ";

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
