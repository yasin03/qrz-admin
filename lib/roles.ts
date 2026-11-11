export const KULLANICI_TIPI = {
  ADMIN: "1",
  YONETICI: "2",
  PERSONEL: "3",
  BAYI : "4",
  DESTEK : "5",
} as const;

export type KullaniciTipi =
  (typeof KULLANICI_TIPI)[keyof typeof KULLANICI_TIPI];
