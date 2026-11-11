export interface LokasyonType {
  IDBolumLokasyon: string;
  IDBolum: string;
  BolumAdi: string;
  LokasyonAdi: string;
  Enlem: string;
  Boylam: string;
  Aktif: boolean;
}

export type LokasyonFilters = {
  IDBolum: string | number | "";
  LokasyonAdi: string;
  Aktif: boolean | null;
};

export interface LokasyonInsertType {
  IDBolum: string;
  LokasyonAdi: string;
  Enlem: string;
  Boylam: string;
  Aktif: boolean | 0 | 1;
}

export interface LokasyonUpdateType {
  IDBolumLokasyon: string;
  IDBolum: string;
  LokasyonAdi: string;
  Enlem: string;
  Boylam: string;
  Aktif: boolean | 0 | 1;
}

export interface LokasyonDeleteType {
  IDBolumLokasyon: string;
}
