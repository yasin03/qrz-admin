/** resmi: resmî tatil, arife: yarım gün idari izin, ozel: anma / kutlama günü (tatil değil). */
export type TakvimGunTipi = "resmi" | "arife" | "ozel";

export type TakvimGunu = {
  /** yyyy-MM-dd */
  date: string;
  name: string;
  type: TakvimGunTipi;
  /** Dinî bayramlar gibi henüz kesinleşmemiş tarihler. */
  tahmini?: boolean;
};

export type TakvimGorunum = "ay" | "hafta" | "yil";
