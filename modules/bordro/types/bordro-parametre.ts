export type EklentiSelectRequestType = {
  IDSube: string | number;
  IDSubePersonel: string | number;
  Tarih1: string;
  Tarih2: string;
};

export type EklentiResponseType = {
  IDSubePersonelYardim: string;
  IDSube: string | number;
  IDSubePersonel: string | number;

  AdSoyad: string;
  OdemeTarihi: string;
  BordroOdemeTutari: number;
  OdemeTipi: string;
  OdemeTipi2: string;
  Net: boolean;
  Net2: string;
  BolumAdi: string;
};

export type EklentiInsertRequestType = {
  IDSube: string | number;
  IDSubePersonel: string;
  BordroOdemeTutari: number;
  OdemeTarihi: string;
  OdemeTipi: string;
  Net: boolean;
};

export type EklentiInsertResponseType = {
  test: number;
  sayi: number;
};

export type EklentiUpdateRequestType = {
  IDSubePersonelYardim: string;
  BordroOdemeTutari: number;
  OdemeTarihi: string;
  OdemeTipi: string;
  Net: boolean;
};

export type EklentiUpdateResponseType = {
  test: number;
};

export type EklentiDeleteRequestType = {
  IDSubePersonelYardim: number;
};

/** Sayfadaki filtre state'i. OdemeTipi/Net "ALL" ise "tümü" anlamına gelir. */
export type EklentiFilters = {
  Tarih1: string; // "yyyy-MM-dd"
  Tarih2: string; // "yyyy-MM-dd"
  OdemeTipi: string;
  Net: "ALL" | "NET" | "BRUT";
};

/** =========================== KESİNTİ =================== */
export type KesintiSelectRequestType = {
  IDSube: string | number;
  IDSubePersonel: string | number;
  Tarih1: string;
  Tarih2: string;
};

export type KesintiResponseType = {
  IDSubePersonelOzelKesinti: string | number;
  IDSube: string | number;
  IDSubePersonel: string | number;

  AdSoyad: string;
  KesintiTarihi: string;
  BordroKesintiTutari: number;
  KesintiTipi: string;
  KesintiTipi2: string;
  BolumAdi: string;
};

export type KesintiInsertRequestType = {
  IDSube: string | number;
  IDSubePersonel: string | number;
  BordroKesintiTutari: number;
  KesintiTarihi: string;
  KesintiTipi: string;
};

export type KesintiInsertResponseType = {
  test: number;
  sayi: number;
};

export type KesintiUpdateRequestType = {
  IDSubePersonelOzelKesinti: string | number;
  BordroKesintiTutari: number;
  KesintiTarihi: string;
  KesintiTipi: string;
};

export type KesintiUpdateResponseType = {
  test: number;
};

export type KesintiDeleteRequestType = {
  IDSubePersonelOzelKesinti: number;
};

/** Sayfadaki filtre state'i. KesintiTipi "ALL" ise "tümü" anlamına gelir. */
export type KesintiFilters = {
  Tarih1: string; // "yyyy-MM-dd"
  Tarih2: string; // "yyyy-MM-dd"
  KesintiTipi: string;
};

/** =========================== MESAİ =================== */
export type MesaiSelectRequestType = {
  IDSube: string | number;
  /** "0" → şubedeki tüm personelin mesai kayıtları */
  IDSubePersonel: string | number;
  Tarih1: string;
  Tarih2: string;
  /** Mesai tipi kodu ("20"); "0" → tüm mesai tipleri */
  MesaiTipi: string;
};

export type MesaiResponseType = {
  IDSubePersonelMesai: string | number;
  IDSube: string | number;
  IDSubePersonel: string | number;

  AdSoyad: string;
  BolumAdi: string;
  Deger: string | number;
  Saat: string | number;
  Tarih: string;
  MesaiTipi: string;
  MesaiTipi2?: string;
  Net: boolean;
};

export type MesaiInsertRequestType = {
  IDSube: string | number;
  IDSubePersonel: string;
  /** Gün + Brüt → "1", Saat + Brüt → saat (en fazla 24), Net → tutar */
  Deger: string;
  Tarih: string;
  MesaiTipi: string;
  Net: boolean;
};

export type MesaiInsertResponseType = {
  test: number;
  sayi: number;
};

export type MesaiUpdateRequestType = MesaiInsertRequestType & {
  IDSubePersonelMesai: string | number;
};

export type MesaiUpdateResponseType = {
  test: number;
};

export type MesaiDeleteRequestType = {
  /** Tek id ya da toplu silmede "-" ile birleştirilmiş id'ler: "12-15-18" */
  IDSubePersonelMesai: string;
};

/** Sayfadaki filtre state'i. MesaiTipi/Net "ALL" ise "tümü" anlamına gelir. */
export type MesaiFilters = {
  Tarih1: string; // "yyyy-MM-dd"
  Tarih2: string; // "yyyy-MM-dd"
  MesaiTipi: string;
  Net: "ALL" | "NET" | "BRUT";
};
