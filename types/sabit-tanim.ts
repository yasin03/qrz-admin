export type SabitTanimlarResponse = unknown[];

export type SabitTanimMadde = {
  IDSabitTanimMadde: string | number;
  IDSabitTanim: string | number;
  SabitTanimMaddeAdi: string;
};

export type SgkBelgeTuru = {
  IDPersonelSgkBelgeTuru: string | number;
  Kod: string;
  Aciklama: string;
  Kod2: string;
};

export type SigortaKolu = {
  Kod: string;
  Kod2: string;
};

export type SgkKanunNo = {
  IDPersonelSgkKanunNo: string | number;
  Kod: string;
  Aciklama: string;
  Kod2: string;
};

export type GorevKodu = {
  IDPersonelSigortaliGorevKodu: string | number;
  Aciklama: string;
};

export type IzinTipleri = {
  Kod: string;
  KisaKod: string;
};

// TahakkukSaha_SELECTByIslem dönüşü
export type EklentiTipi = {
  SahaKodu: number;
  SahaAciklama: string;
  SahaAciklama2: string;
};
