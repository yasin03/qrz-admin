export type AvansType = {
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  SicilNo: string;
  TcKimlikNo: string;
  Ad: string;
  Soyad: string;
  IDIzinGenel: string;
  IDSubePersonelAvansTalep: string;
  OdemeBaslangicTarihi: string;
  Tutar: number;
  TaksitSayisi: string;
  OnayDurum: number;
  Tarih: string;
  RedDurum: string;
  SubeAdi: string;
  AdSoyad: string;
  RedAciklama: string;
  Mesaj: boolean;
};

/** Sayfadaki filtre state'i. Aciklama boşsa "tümü" anlamına gelir. */
export type AvansFilters = {
  BaslangicTarihi: string; // "yyyy-MM-dd"
  BitisTarihi: string; // "yyyy-MM-dd"
  Aciklama: string;
  Durum: "ALL" | "ONAYLANDI" | "BEKLIYOR" | "REDDEDILDI";
};

export type AvansSelectParams = {
  IDSubePersonel: string; // yönetici/admin -> "0", personel -> kendi id'si
  BaslangicTarihi: string;
  BitisTarihi: string;
};

export type AvansDeleteParams = {
  IDIzinGenel: string;
};

export type AvansInsertParams = {
  IDSubePersonel: string; // "40-25-32" formatında, "-" ile birleşik
  Tutar: number;
  TaksitSayisi: number | string;
  BordroKesintiTutari: number;
  Mesaj: string;
  OdemeBaslangicTarihi: string;
};

export type AvansTalepSelectParams = {
  IDSube: string;
  IDSubePersonel: string; // personel -> kendi id'si, admin/yönetici -> "0"
  BaslangicTarihi: string;
  BitisTarihi: string;
};

export type AvansTalepType = {
  IDSubePersonel: string;
  IDSube: string;
  IDBolum: string;
  SicilNo: string;
  TcKimlikNo: string;
  Ad: string;
  Soyad: string;
  IDIzinGenel: string;
  IDSubePersonelAvansTalep: string;
  OdemeBaslangicTarihi: string;
  Tutar: number;
  TaksitSayisi: string;
  OnayDurum: number;
  Tarih: string;
  RedDurum: string | null;
  SubeAdi: string;
  AdSoyad: string;
  RedAciklama: string | null;
  Mesaj: string;
};

export type AvansTalepInsertParams = {
  IDSubePersonel: string;
  Tutar: number;
  TaksitSayisi: string;
  BordroKesintiTutari: number;
  Mesaj: string;
  OdemeBaslangicTarihi: string;
};

export type AvansTalepUpdateParams = {
  IDSubePersonelAvansTalep: string;
  IDKullanici: string;
  KabulRed: string; // "1" = Onay, "2" = Red — backend değerleri netleşince güncellenebilir
  RedAciklama: string;
};
