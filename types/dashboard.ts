// /api/dashboard cevap tipleri. qrz-mobile/src/types/dashboard.ts ile aynı tutulmalı.
// Her bölüm bağımsız sorgudan gelir; sorgu hata verirse o bölüm null döner.

export type DashboardType = "PERSONEL_OZET" | "YONETICI_OZET";

export type PersonelDashboard = {
  personel: {
    IDSubePersonel: string;
    AdSoyad: string;
    Unvan: string | null;
    BolumAdi: string | null;
    SicilNo: string | null;
    DogumTarihi: string | null; // yyyy-MM-dd
    /** Bir sonraki doğum gününe kalan gün (0 = bugün) */
    DogumGunuKalanGun: number | null;
    IseGirisTarihi: string | null; // yyyy-MM-dd
    /** İşe girişten bugüne geçen gün */
    CalistigiGun: number | null;
    /** "3 yıl 2 ay" */
    Kidem: string | null;
  } | null;

  yillikIzin: {
    ToplamHak: number;
    Kullanilan: number;
    Kalan: number;
  } | null;

  sonrakiIzin: {
    BaslangicTarihi: string; // yyyy-MM-dd
    BitisTarihi: string;
    Tip: string;
    Gun: number;
    /** Başlangıca kalan gün (0 = bugün başlıyor) */
    KalanGun: number;
  } | null;

  bekleyenTalepler: {
    Izin: number;
    Avans: number;
  } | null;

  avans: {
    /** Yıl başından bugüne verilen avans toplamı */
    ToplamTutar: number;
    Adet: number;
    /** Aktif avansların aylık bordro kesintisi toplamı */
    AylikKesinti: number;
  } | null;

  maas: {
    Yil: string;
    Ay: string;
    NetOdenen: number;
    OdenecekTutar: number;
    Onayli: boolean;
  } | null;

  puantaj: {
    Yil: string;
    Ay: string;
    CalisilanGun: number;
    CalisilanSaat: number;
    FazlaMesai: number;
  } | null;

  eklentiKesinti: {
    /** Yıl başından bugüne */
    EklentiToplam: number;
    KesintiToplam: number;
  } | null;

  pdksBugun: {
    Giris: string | null;
    Cikis: string | null;
  } | null;
};

export type YoneticiDashboard = {
  personelSayisi: number | null;

  bugunIzinde: {
    Sayi: number;
    Liste: { IDSubePersonel: string; AdSoyad: string; Tip: string; BitisTarihi: string }[];
  } | null;

  bekleyenTalepler: {
    Izin: number;
    Avans: number;
  } | null;

  bordro: {
    Yil: string;
    Ay: string;
    Toplam: number;
    Hesaplanan: number;
    Onayli: number;
    OnayBekleyen: number;
    ToplamOdenecek: number;
  } | null;

  pdksBugun: {
    Gelen: number;
    Gelmeyen: number | null;
  } | null;

  /** Personel listesi doğum tarihi döndürmüyorsa null */
  dogumGunleri: { IDSubePersonel: string; AdSoyad: string; Tarih: string; KalanGun: number }[] | null;
};
