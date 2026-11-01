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
