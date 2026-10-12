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

// Personelin kendi kayıtları (SELECT_PDKS_KENDI) - IDSubePersonel session'dan gelir
export type PDKSKendiSelectRequestType = {
  Yil: string;
  /** "01".."12" */
  Ay: string;
};

export type PDKSKendiSelectResponseType = {
  IDSubePersonelSaat: string;
  IDSubePersonel: string;
  Tarih: string;
  Giris: string | null;
  Cikis: string | null;
  NormalSure: string | null;
  MesaiSure: string | null;
  IzinSure: string | null;
  ToplamSure: string | null;
};

export type PdksYon = "Giriş" | "Çıkış";

export type PDKSUpdateInput = {
  /** Tek kayıt için id, toplu işlemde id'ler "-" ile birleştirilmiş string (ör. "12-15-18"). */
  IDSubePersonelSaat: string;
  Yon: PdksYon;
  /** "HH:mm" (ör. "09:00") */
  Saat: string;
};

export type PDKSUpdateResponseType = {
  test: number;
};

export type PDKSDeleteInput = {
  /** Tek kayıt için id, toplu işlemde id'ler "-" ile birleştirilmiş string (ör. "12-15-18"). */
  IDSubePersonelSaat: string;
};

/** test: 1 başarılı, 0 başarısız */
export type PDKSDeleteResponseType = {
  test: number;
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
