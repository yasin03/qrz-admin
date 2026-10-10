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

// Gosterge_SELECTByYil dönüşü — güncel asgari ücret (aylık)
export type AsgariUcret = {
  Brut: number;
  Net: number;
  EmekliNet: number;
};

// PersonelMeslekKodu_SELECT dönüşü (arama ile, liste tamamı gelmiyor)
export type MeslekKodu = {
  IDPersonelMeslekKodu: string | number;
  Kod: string; // "0210.00"
  Aciklama: string;
  Kod2: string; // "0210.00-Subay olmayan silahlı..."
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
