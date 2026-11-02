// ---- Tatiller -------------------------------------------------------------

export type TatilType = {
  IDTatil: number;
  Tarih: string; // "dd.MM.yyyy"
  Tarih2: string; // ISO
  Kodgun: number; // 1: Pazartesi ... 7: Pazar (HAFTA_DATA)
  HaftaKodu: number; // tarihin yılı
  Aciklama: string;
  Durum: string; // "Tam Gün" | "Yarım Gün"
  ResmiDini: string; // "Resmi" | "Dini"
};

export type TatilDurum = "T" | "Y";
export type TatilResmiDini = "Resmi" | "Dini";

export type TatilSelectRequestType = {
  Yil: string;
};

export type TatilInsertRequestType = {
  Tarih: string; // "yyyy-MM-dd"
  KodGun: number;
  HaftaKodu: number;
  Aciklama: string;
  Durum: TatilDurum;
  ResmiDini: TatilResmiDini;
};

export type TatilUpdateRequestType = TatilInsertRequestType & {
  IDTatil: number;
};

export type TatilDeleteRequestType = {
  IDTatil: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type TatilResponseType = {
  test: number;
};

export type TatilFilters = {
  Durum: "ALL" | TatilDurum;
  ResmiDini: "ALL" | TatilResmiDini;
};

// ---- İzin Limitleri -------------------------------------------------------

export type IzinLimitNitelik = "YIL" | "YAŞ";

export type IzinLimitType = {
  IDPersonelIzinLimit: number;
  Nitelik: string; // "YIL" | "YAŞ"
  Baslangic: number;
  Bitis: number;
  Deger: number;
};

export type IzinLimitInsertRequestType = {
  Nitelik: IzinLimitNitelik;
  Baslangic: number;
  Bitis: number;
  Deger: number;
};

export type IzinLimitUpdateRequestType = IzinLimitInsertRequestType & {
  IDPersonelIzinLimit: number;
};

export type IzinLimitDeleteRequestType = {
  IDPersonelIzinLimit: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type IzinLimitResponseType = {
  test: number;
};

export type IzinLimitFilters = {
  Nitelik: "ALL" | IzinLimitNitelik;
};

// ---- Vergi Yüzde Oranları -------------------------------------------------

export type VergiOranType = {
  IDVergiYuzde: number;
  Yil: number;
  Baslangic: number; // decimal, örn. 190000.01
  Bitis: number;
  Yuzde: number; // 0-100
};

export type VergiOranSelectRequestType = {
  Yil: string;
};

export type VergiOranInsertRequestType = {
  Yil: number;
  Baslangic: number;
  Bitis: number;
  Yuzde: number;
};

export type VergiOranUpdateRequestType = VergiOranInsertRequestType & {
  IDVergiYuzde: number;
};

export type VergiOranDeleteRequestType = {
  IDVergiYuzde: number;
};

/** Yil'daki kayıtları Yil2'ye kopyalar (Vergi oranları, Katsayılar). */
export type YilAktarRequestType = {
  Yil: number;
  Yil2: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type VergiOranResponseType = {
  test: number;
};

export type VergiOranFilters = {
  /** "ALL" ya da tek bir yüzde değeri ("15") */
  Yuzde: string;
};

// ---- Katsayı Oranları (Gösterge) ------------------------------------------

/** Aylık bordro göstergeleri. Oran alanları: DamgaVergisi (örn. 0.00759),
 *  SgkIssizIsverenPrimiOran (yüzde, örn. 2); diğerleri tutar. */
export type KatsayiOranDegerleri = {
  DamgaVergisi: number;
  SskGunlukTaban: number;
  SskGunlukTavan: number;
  SskAylikTaban: number;
  SskAylikTavan: number;
  DamgaVergisiIstisnasi: number;
  AuGelirVergisiMatrahi: number;
  GelirVergisiIstisnasi: number;
  SgkIssizIsverenPrimiOran: number;
  EmekliNet: number;
};

export type KatsayiOranType = KatsayiOranDegerleri & {
  IDGosterge: string | number;
  Yil: string | number;
  Ay: string; // "01" ... "12" (AY_DATA)
};

export type KatsayiOranSelectRequestType = {
  Yil: string;
};

export type KatsayiOranInsertRequestType = KatsayiOranDegerleri & {
  Yil: number;
  Ay: string;
};

export type KatsayiOranUpdateRequestType = KatsayiOranInsertRequestType & {
  IDGosterge: number;
};

export type KatsayiOranDeleteRequestType = {
  IDGosterge: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type KatsayiOranResponseType = {
  test: number;
};

export type KatsayiOranFilters = {
  /** "ALL" ya da AY_DATA value ("01") */
  Ay: string;
};
