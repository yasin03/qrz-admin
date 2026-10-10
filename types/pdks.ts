export interface PDKSSelectParams {
  IDSube: string; // "0" | context'teki IDSube
  IDBolum: string; // "0" | seçilen bölüm
  Tarih: string; // "yyyy-MM-dd"
}
export type PDKSSelectRequestType = {
  IDSube: string | number;
  IDBolum: string | number;
  Tarih: string;
};

export type PDKSSelectResponseType = {
  IDSubePersonelSaat: string;
  IDSubePersonel: string;
  AdSoyad: string;
  Tarih: string;
  Giris: string;
  Cikis: string | null;
  NormalSure: string | null;
  MesaiSure: string | null;
  IzinSure: string | null;
  ToplamSure: string | null;
  GirisNotu: string | null;
  CikisNotu: string | null;
  MesaiNotu: string | null;
  Cinsiyet: string | null;
  IDKullanici: string | number;
};

export type PDKSDetaySelectRequestType = {
  IDSubePersonelSaat: string | number;
};

export type PDKSDetaySelectResponseType = {
  IDBolumLokasyon: string | number;
  LokasyonAdi: string;
  Enlem: string;
  Boylam: string;
  Yon: string;
  Tarih: string;
};

export interface SubeVardiyaSaat {
  IDSubeVardiyaSaat: number;
  VardiyaAdi: string;
  BaslamaSaati: string; // "HH:mm"
  BitisSaati: string; // "HH:mm"
  Gece: boolean;
  HT: number; // 1: Pazartesi ... 7: Pazar
  HTGun: string;
}

// INSERT_PDKS_SUBE için gönderilecek alanlar (IDSube route'da token'dan eklenir)
export type SubeVardiyaInsertInput = Omit<SubeVardiyaSaat, "IDSubeVardiyaSaat">;

// UPDATE_PDKS_SUBE için gönderilecek alanlar
export type SubeVardiyaUpdateInput = SubeVardiyaSaat;

export interface BolumVardiyaSaat {
  IDBolumVardiyaSaat: number;
  IDBolum: number;
  VardiyaAdi: string;
  BaslamaSaati: string; // "HH:mm"
  BitisSaati: string; // "HH:mm"
  Gece: boolean;
  HT: number; // 1: Pazartesi ... 7: Pazar
  HTGun: string;
}

// IDBolum, Sube'nin aksine session'dan gelmiyor — dropdown'dan seçilip
// gönderiliyor, bu yüzden insert payload'ında da yer alıyor.
export type BolumVardiyaInsertInput = Omit<
  BolumVardiyaSaat,
  "IDBolumVardiyaSaat"
>;

export type BolumVardiyaUpdateInput = BolumVardiyaSaat;
