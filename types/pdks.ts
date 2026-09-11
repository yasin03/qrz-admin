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
