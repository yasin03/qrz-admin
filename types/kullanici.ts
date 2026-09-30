export type SelectKullaniciRequestType = {
  IDKullanici?: string | number;
};

export type SelectKullaniciResponseType = {
  IDKullanici: string | number;
  KullaniciAdi: string;
  KullaniciTipi: string;
  Ad: string;
  Aciklama: string | null;
  Durum: boolean;
  Tel: string | null;
  Email: string | null;
  OzelYetki: string | null;
  Ad2: string | null;
  YetkiKullanici: boolean;
  YetkiGrup: boolean;
  YetkiSirket: boolean;
  YetkiSube: boolean;
  CreatedDate: string | null;
  LastLoginDate: string | null;
};

export type YetkiAlani =
  | "YetkiKullanici"
  | "YetkiGrup"
  | "YetkiSirket"
  | "YetkiSube";

export type KullaniciFilters = {
  KullaniciTipi: string;
  Durum: boolean | null;
  Yetki: YetkiAlani | "";
};

// IDSirket ve Sahibi route içinde session'dan set ediliyor.
export type InsertKullaniciRequestType = {
  KullaniciAdi: string;
  Sifre: string;
  Ad: string;
  Tel: string;
  Email: string;
};

export type InsertKullaniciResponseType = {
  test: number | string;
};

export type UpdateKullaniciRequestType = {
  IDKullanici: string | number;
  Sifre: string;
  Ad: string;
  Durum: 0 | 1;
  Tel: string;
  Email: string;
  YetkiKullanici: 0 | 1;
  YetkiGrup: 0 | 1;
  YetkiSirket: 0 | 1;
  YetkiSube: 0 | 1;
};

export type UpdateKullaniciResponseType = {
  test: number | string;
};

export type DeleteKullaniciRequestType = {
  IDKullanici: string | number;
};

export type DeleteKullaniciResponseType = {
  test: number | string;
};

export type SelectKullaniciYetkiRequestType = {
  IDKullanici: string | number;
};

export type SelectKullaniciYetkiResponseType = {
  IDKullaniciAlan: string | number;
  GurupAdi: string;
  SirketAdi: string;
  SubeAdi: string;
  BolumAdi: string;
  IDGurup: string | number;
  IDSirket: string | number;
  IDSube: string | number;
  IDBolum: string | number;
};

export type InsertKullaniciYetkiRequestType = {
  IDKullanici: string | number;
  IDGurup: string | number;
  IDSirket: string | number;
  IDSube: string | number;
  IDBolum: string | number;
  GurupAdi: string;
  SirketAdi: string;
  SubeAdi: string;
  BolumAdi: string;
};

export type InsertKullaniciYetkiResponseType = {
  test: number | string;
};

export type DeleteKullaniciYetkiRequestType = {
  IDKullaniciAlan: string | number;
};

export type DeleteKullaniciYetkiResponseType = {
  test: number | string;
};
