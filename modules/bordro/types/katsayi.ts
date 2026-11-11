export type KatsayiType = {
  IDSubeTahakkukSaha: number;
  /** Tümü, Ödeme, Kesinti, İndirim */
  Tipi: string;
  SahaAciklama: string;
  MaksimumDeger: number | string | null;
  MinimumDeger: number | string | null;
  /** Gün, Saat, Sicil, Tutar */
  OdemeSekli: string;
  Katsayi: number | string | null;
  /** Brüt, Net, Sicil */
  NetBrut: string;
  SskMuafiyeti: number | string | null;
  VergiMuafiyeti: number | string | null;
  SgkUygulamaDurum: boolean;
  VergiUygulamaDurum: boolean;
  DamgaUygulamaDurum: boolean;
  SendikaliOdeme: boolean;
  SendikasizOdeme: boolean;
};

// IDSirket route içinde session'dan alınıyor; Yil verilmezse session'daki yıl kullanılır.
export type KatsayiSelectRequestType = {
  Yil: string;
};

export type KatsayiUpdateRequestType = {
  IDSubeTahakkukSaha: number;
  Tipi: string;
  SahaAciklama: string;
  MaksimumDeger: string;
  MinimumDeger: string;
  OdemeSekli: string;
  Katsayi: string;
  NetBrut: string;
  SskMuafiyeti: string;
  VergiMuafiyeti: string;
  // SQL tarafına bit olarak gidiyor
  SgkUygulamaDurum: 0 | 1;
  VergiUygulamaDurum: 0 | 1;
  DamgaUygulamaDurum: 0 | 1;
  SendikaliOdeme: 0 | 1;
  SendikasizOdeme: 0 | 1;
};

/** Update: test === 1 başarılı, 0 başarısız (SP test dönüyorsa). */
export type KatsayiResponseType = {
  test?: number;
};

export type KatsayiFilters = {
  /** null → session'daki yıl */
  Yil: string | null;
  /** "" → hepsi */
  Tipi: string;
};
