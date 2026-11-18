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

/* ------------------------------------------------------------------ */
/* Ajanda                                                              */
/* Tarihler API'de "yyyy-MM-ddTHH:mm:ss(.sss)Z" gelir ama TR yerel      */
/* saatidir (Z yok sayılır) — bkz. modules/core/lib/ajanda.ts           */
/* ------------------------------------------------------------------ */

/** mssql bigint kolonları string döner. */
export type DbId = string | number;

/** 0 Bekliyor, 1 Kabul, 2 Ret */
export type AjandaKatilimDurumu = 0 | 1 | 2;

/** Bit flag: 1 Uygulama içi, 2 E-posta, 3 İkisi */
export type AjandaHatirlatmaKanal = 1 | 2 | 3;

export type AjandaKayitTipi = "tekil" | "seri" | "istisna";

/** Ajanda_SELECT_ByTarih satırı (ham, açılmamış). */
export type AjandaKayitRow = {
  KayitTipi: AjandaKayitTipi;
  IDAjanda: DbId;
  IDAjandaSeri: DbId | null;
  OrijinalTarih: string | null;
  Iptal: boolean;
  IDOlusturan: DbId;
  IDAjandaKategori: DbId | null;
  KategoriAd: string | null;
  /** Kayıt rengi, yoksa kategori rengi (#RRGGBB). */
  Renk: string | null;
  Baslik: string;
  Aciklama: string | null;
  Konum: string | null;
  TumGun: boolean;
  Baslangic: string;
  Bitis: string | null;
  TekrarKurali: string | null;
  TekrarBitis: string | null;
  Sahip: boolean;
  Durum: AjandaKatilimDurumu;
  HatirlatmaDakika: number | null;
  HatirlatmaKanal: AjandaHatirlatmaKanal | null;
  KatilimciSayisi: number;
};

/** Takvimde gösterilen tek bir olay (seriler tekrarlarına açılmış halde). */
export type AjandaOlay = {
  /** Listede benzersiz anahtar. */
  key: string;
  /** Düzenleme/silme için kayıt ID'si (istisnada istisna satırının ID'si). */
  IDAjanda: string;
  /** Tekrarlı serinin ID'si (seri tekrarı veya istisna ise dolu). */
  IDAjandaSeri: string | null;
  /** Tekrarın serideki asıl başlangıcı ("sadece bu" işlemleri için). */
  tekrarTarihi: Date | null;
  tekrarli: boolean;
  istisna: boolean;
  baslangic: Date;
  bitis: Date | null;
  tumGun: boolean;
  baslik: string;
  aciklama: string | null;
  konum: string | null;
  renk: string | null;
  IDAjandaKategori: string | null;
  kategoriAd: string | null;
  tekrarKurali: string | null;
  sahip: boolean;
  durum: AjandaKatilimDurumu;
  katilimciSayisi: number;
  hatirlatmaDakika: number | null;
  hatirlatmaKanal: AjandaHatirlatmaKanal | null;
};

/** Ajanda_SELECT result set 1. */
export type AjandaDetay = {
  IDAjanda: DbId;
  IDAjandaSeri: DbId | null;
  OrijinalTarih: string | null;
  Iptal: boolean;
  IDOlusturan: DbId;
  IDAjandaKategori: DbId | null;
  KategoriAd: string | null;
  KategoriRenk: string | null;
  Renk: string | null;
  Baslik: string;
  Aciklama: string | null;
  Konum: string | null;
  TumGun: boolean;
  Baslangic: string;
  Bitis: string | null;
  TekrarKurali: string | null;
  TekrarBitis: string | null;
  OlusturmaTarihi: string;
  GuncellemeTarihi: string | null;
  Sahip: boolean;
  Durum: AjandaKatilimDurumu;
  HatirlatmaDakika: number | null;
  HatirlatmaKanal: AjandaHatirlatmaKanal | null;
};

/** Ajanda_SELECT result set 2. */
export type AjandaKatilimci = {
  IDAjandaKatilimci: DbId;
  IDKullanici: DbId;
  Durum: AjandaKatilimDurumu;
  Email: string | null;
};

export type AjandaDetayResponse = {
  kayit: AjandaDetay | null;
  katilimcilar: AjandaKatilimci[];
};

/** Ekle / güncelle formu. Tarihler Date olarak verilir, servis çevirir. */
export type AjandaKaydetParams = {
  Baslik: string;
  Aciklama?: string | null;
  Konum?: string | null;
  IDAjandaKategori?: DbId | null;
  Renk?: string | null;
  TumGun: boolean;
  Baslangic: Date;
  Bitis?: Date | null;
  /** RRULE (FREQ=...). Boş = tekrarsız. TekrarBitis servis tarafından hesaplanır. */
  TekrarKurali?: string | null;
  /** Katılımcı IDKullanici listesi. undefined → güncellemede dokunulmaz. */
  Katilimcilar?: DbId[];
  HatirlatmaDakika?: number | null;
  HatirlatmaKanal?: AjandaHatirlatmaKanal | null;
};

export type AjandaGuncelleParams = AjandaKaydetParams & {
  IDAjanda: DbId;
  IstisnalariSil?: boolean;
};

/** "Sadece bu tekrar" düzenleme. Iptal=true ise diğer alanlar gerekmez. */
export type AjandaIstisnaParams = {
  IDAjandaSeri: DbId;
  OrijinalTarih: Date;
  Iptal?: boolean;
  Baslik?: string;
  Aciklama?: string | null;
  Konum?: string | null;
  IDAjandaKategori?: DbId | null;
  Renk?: string | null;
  TumGun?: boolean;
  Baslangic?: Date;
  Bitis?: Date | null;
};

export type AjandaInsertResponse = {
  IDAjanda: DbId | null;
  yeniKatilimcilar: DbId[];
};

export type AjandaUpdateResponse = AjandaInsertResponse & {
  ZamanDegisti: boolean;
};

export type AjandaIstisnaResponse = {
  IDAjanda: DbId | null;
  ZamanDegisti: boolean;
};

export type AjandaKategori = {
  IDAjandaKategori: DbId;
  IDKullanici: DbId | null;
  Ad: string;
  Renk: string;
  Sira: number;
  /** Sistem kategorisi (düzenlenemez/silinemez). */
  Sistem: boolean;
};

export type AjandaKategoriKaydetParams = {
  IDAjandaKategori?: DbId;
  Ad: string;
  Renk: string;
  Sira?: number;
};

/** Ajanda_SELECT_HatirlatmaAdaylari result set 1. */
export type AjandaHatirlatmaAdayRow = {
  IDAjandaKatilimci: DbId;
  IDKullanici: DbId;
  Sahip: boolean;
  HatirlatmaDakika: number;
  HatirlatmaKanal: AjandaHatirlatmaKanal;
  SonHatirlatma: string | null;
  IDAjanda: DbId;
  Baslik: string;
  Aciklama: string | null;
  Konum: string | null;
  TumGun: boolean;
  Baslangic: string;
  Bitis: string | null;
  TekrarKurali: string | null;
  TekrarBitis: string | null;
  KategoriAd: string | null;
  Renk: string | null;
  Email: string | null;
};

/** Ajanda_SELECT_HatirlatmaAdaylari result set 2. */
export type AjandaHatirlatmaIstisnaRow = {
  IDAjandaSeri: DbId;
  IDAjanda: DbId;
  OrijinalTarih: string;
  Iptal: boolean;
  Baslik: string;
  Konum: string | null;
  TumGun: boolean;
  Baslangic: string;
  Bitis: string | null;
};

export type AjandaHatirlatmaResponse = {
  adaylar: AjandaHatirlatmaAdayRow[];
  istisnalar: AjandaHatirlatmaIstisnaRow[];
};

/** Zamanı gelmiş bir uygulama içi hatırlatma. */
export type AjandaHatirlatma = {
  /** IDAjanda + tekrar başlangıcı — "kapatıldı" bilgisini tutmak için. */
  key: string;
  IDAjanda: string;
  baslik: string;
  konum: string | null;
  renk: string | null;
  tumGun: boolean;
  baslangic: Date;
};
