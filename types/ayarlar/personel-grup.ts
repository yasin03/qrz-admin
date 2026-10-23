export type PersonelGrupType = {
  IDSirketPersonelGrup: string | number;
  Kod: string;
  Adi: string;
};

// IDSirket route içinde session'dan alınıyor, client göndermiyor.
export type PersonelGrupInsertRequestType = {
  Kod: string;
  Adi: string;
};

export type PersonelGrupUpdateRequestType = PersonelGrupInsertRequestType & {
  IDSirketPersonelGrup: string | number;
};

export type PersonelGrupDeleteRequestType = {
  IDSirketPersonelGrup: string | number;
};

/**
 * Insert: test >= 1 başarılı, 0 → aynı kodla grup zaten var.
 * Update/Delete: test === 1 başarılı, 0 başarısız.
 */
export type PersonelGrupResponseType = {
  test: number;
};
