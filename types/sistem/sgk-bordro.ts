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

/** Yil'daki kayıtları Yil2'ye kopyalar (Vergi oranları, Katsayılar, Engelli indirimleri, Kıdem/İhbar). */
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

// ---- Engelli İndirim Oranları ---------------------------------------------

export type EngelliIndirimType = {
  IDPersonelEngelliIndirim: number;
  Yil: number;
  Derece: number; // 1, 2, 3
  Aciklama: string;
  IndirimTutari: number; // decimal, örn. 12000.50
};

export type EngelliIndirimSelectRequestType = {
  Yil: string;
};

export type EngelliIndirimInsertRequestType = {
  Yil: number;
  Derece: number;
  Aciklama: string;
  IndirimTutari: number;
};

export type EngelliIndirimUpdateRequestType =
  EngelliIndirimInsertRequestType & {
    IDPersonelEngelliIndirim: number;
  };

export type EngelliIndirimDeleteRequestType = {
  IDPersonelEngelliIndirim: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type EngelliIndirimResponseType = {
  test: number;
};

export type EngelliIndirimFilters = {
  /** "ALL" ya da tek bir derece değeri ("1") */
  Derece: string;
};

// ---- Meslek Kodları -------------------------------------------------------

export type MeslekKoduType = {
  IDPersonelMeslekKodu: number;
  Kod: string; // örn. "0110.01"
  Aciklama: string;
  Kod2: string; // "0110.01-Genelkurmay Başkanı"
};

export type MeslekKoduInsertRequestType = {
  Kod: string;
  Aciklama: string;
};

export type MeslekKoduUpdateRequestType = MeslekKoduInsertRequestType & {
  IDPersonelMeslekKodu: number;
};

export type MeslekKoduDeleteRequestType = {
  IDPersonelMeslekKodu: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type MeslekKoduResponseType = {
  test: number;
};

export type MeslekKoduFilters = {
  /** "ALL" ya da Kod'un ilk hanesi, ISCO ana grubu ("0" ... "9") */
  AnaGrup: string;
};

// ---- Kıdem İhbar Tanımları ------------------------------------------------

export type KidemIhbarTip = "İhbar" | "Kıdem";

export type KidemIhbarType = {
  IDPersonelKidemSure: number;
  Yil: number;
  Aciklama: string;
  BaslangicGun: number;
  BitisGun: number;
  HesaplanacakGun: number;
  Tip: string; // "İhbar" | "Kıdem"
  MaksimumDeger: number; // decimal
  BaslangicAy: string; // "01" ... "12" (AY_DATA)
  BitisAy: string;
};

export type KidemIhbarSelectRequestType = {
  Yil: string;
};

export type KidemIhbarInsertRequestType = {
  Yil: number;
  Aciklama: string;
  BaslangicGun: number;
  BitisGun: number;
  HesaplanacakGun: number;
  Tip: KidemIhbarTip;
  MaksimumDeger: number;
  BaslangicAy: string;
  BitisAy: string;
};

export type KidemIhbarUpdateRequestType = KidemIhbarInsertRequestType & {
  IDPersonelKidemSure: number;
};

export type KidemIhbarDeleteRequestType = {
  IDPersonelKidemSure: number;
};

/** test === 1 başarılı, 0 başarısız. */
export type KidemIhbarResponseType = {
  test: number;
};

export type KidemIhbarFilters = {
  Tip: "ALL" | KidemIhbarTip;
};
