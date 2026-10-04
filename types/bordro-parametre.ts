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
