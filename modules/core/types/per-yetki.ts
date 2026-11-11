// DB bit alanları true/false veya 1/0 olarak gelebiliyor.
type DbBool = boolean | number;

export type PerYetkiType = {
  IDSirketSabit: string | number;
  IDSirket: string | number;
  PersonelPdksGorur: DbBool;
  PersonelPuantajGorur: DbBool;
  PersonelBordroGorur: DbBool;
  PersonelHerLokasyonuKullanabilir: DbBool;
};

// IDSirket route içinde session'dan alınıyor, client göndermiyor.
export type PerYetkiUpdateRequestType = {
  PersonelPdksGorur: boolean;
  PersonelPuantajGorur: boolean;
  PersonelBordroGorur: boolean;
  PersonelHerLokasyonuKullanabilir: boolean;
};

/** test === 1 başarılı. */
export type PerYetkiResponseType = {
  test: number;
};
