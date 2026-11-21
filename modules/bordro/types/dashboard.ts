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

  /** Bu ayın (ay başı → bugün) PDKS özeti; süreler saat cinsinden */
  pdksAy: {
    GirisYapilanGun: number;
    ToplamCalisma: number;
    OrtalamaCalisma: number | null;
    ToplamMesai: number;
    Gunler: { Tarih: string; Gun: number; Calisma: number; Mesai: number }[];
  } | null;
};

export type CinsiyetSayilari = {
  Erkek: number;
  Kadin: number;
  /** Cinsiyeti boş/tanımsız gelenler */
  Belirtilmemis: number;
};

export type YoneticiDashboard = {
  /** Aktif (Durum = true) personel sayısı */
  personelSayisi: number | null;

  /** Aktif personelin cinsiyet ve personel grubu dağılımı */
  personelDagilim: (CinsiyetSayilari & {
    Toplam: number;
    /** Grubu olmayanlar "Diğer" altında, listenin sonunda */
    Gruplar: (CinsiyetSayilari & { Grup: string; Toplam: number })[];
  }) | null;

  bugunIzinde: {
    Sayi: number;
    Liste: { IDSubePersonel: string; AdSoyad: string; Tip: string; BitisTarihi: string }[];
  } | null;

  bekleyenTalepler: {
    Izin: number;
    Avans: number;
    /** Yeniden eskiye, en fazla 10 kayıt */
    Liste: BekleyenTalep[];
  } | null;

  bordro: {
    Yil: string;
    Ay: string;
    Toplam: number;
    Hesaplanan: number;
    Onayli: number;
    OnayBekleyen: number;
    Hesaplanmadi: number;
    ToplamOdenecek: number;
    /** Aşağıdaki tutarlar sadece hesaplanmış bordrolardan */
    ToplamMaliyet: number;
    NetOdenen: number;
    /** İşçi + işsizlik işçi primi */
    SgkIsciPrimi: number;
    /** İşveren + işsizlik işveren primi */
    SgkIsverenPrimi: number;
    GelirVergisi: number;
    DamgaVergisi: number;
    /** Yasal kesintiler dışındaki kesintiler (avans, icra, sendika…) */
    DigerKesinti: number;
    Tesvik5510: number;
    Tesvik4447: number;
    /** 5510 + 4447 */
    TesvikToplam: number;
    /** Bölüm bazında toplam işveren maliyeti; ilk 8 bölüm, kalanı "Diğer" */
    BolumMaliyet: { Etiket: string; Tutar: number; Sayi: number }[];
    /** Ödenecek tutarı negatif çıkan bordrolar */
    Negatif: { IDSubePersonel: string; AdSoyad: string; OdenecekTutar: number }[];
  } | null;

  pdksBugun: {
    Gelen: number;
    Gelmeyen: number | null;
    /** Aktif, girişi olmayan ve bugün izinde olmayan personel */
    GelmeyenListe: { IDSubePersonel: string; AdSoyad: string }[] | null;
    /** Süresi hesaplanmış kişilerin ortalama çalışma saati */
    OrtalamaCalisma: number | null;
    SuresiHesaplanan: number;
    /** Bugünkü toplam mesai saati */
    ToplamMesai: number;
    MesaiYapan: number;
    KonumDisi: number;
    KonumDisiListe: PdksKisi[];
    /** Giriş yapıp henüz çıkış yapmayanlar */
    CikisYok: number;
    CikisYokListe: PdksKisi[];
  } | null;

  /** Personel listesi doğum tarihi döndürmüyorsa null */
  dogumGunleri: { IDSubePersonel: string; AdSoyad: string; Tarih: string; KalanGun: number }[] | null;

  /** Önümüzdeki 30 gündeki iş yıldönümleri (en az 1 yıl) */
  isYildonumleri:
    | { IDSubePersonel: string; AdSoyad: string; Tarih: string; KalanGun: number; Yil: number }[]
    | null;

  /** Seçili dönemde (Yil/Ay) işe girenler ve çıkanlar (pasifler dahil) */
  personelHareket: {
    Giren: number;
    Cikan: number;
    GirenListe: PersonelTarih[];
    CikanListe: PersonelTarih[];
  } | null;

  /** Aktif personelin tanımlı ücretleri; brüt ve net ayrı */
  ucret: { BrutToplam: number; BrutSayi: number; NetToplam: number; NetSayi: number } | null;

  /** Aktif personel dağılımları */
  demografi: {
    /** Sabit sıralı aralıklar; tarihi olmayanlar "Belirtilmemiş" */
    Yas: EtiketSayi[];
    Kidem: EtiketSayi[];
    /** İlk 8 bölüm, kalanı "Diğer" */
    Bolum: EtiketSayi[];
    UcretTipi: EtiketSayi[];
    CalismaDurumu: EtiketSayi[];
    MedeniDurum: EtiketSayi[];
  } | null;

  /** Son 1 yılın izinleri + önümüzdeki 7 gün */
  izin: {
    /** Son 12 ay tür bazında izin günü; ilk 5 tür, kalanı "Diğer" */
    Turler: { Etiket: string; Gun: number }[];
    /** Son 12 ay (bu ay dahil) aylık izin günü ve izin kullanan kişi */
    Aylik: { Etiket: string; Gun: number; Kisi: number }[];
    /** Önümüzdeki 7 günde başlayacak izinler */
    Yaklasan: {
      IDSubePersonel: string;
      AdSoyad: string;
      Tip: string;
      BaslangicTarihi: string;
      BitisTarihi: string;
      Gun: number;
      KalanGun: number;
    }[];
  } | null;

  /** Son 12 ay işe giriş / çıkış sayıları */
  hareketTrendi: { Etiket: string; Giren: number; Cikan: number }[] | null;

  /** Son 7 gün devam; Gelmeyen bugünkü aktif personel sayısına göre yaklaşık */
  devamTrendi:
    | {
        Tarih: string;
        Etiket: string;
        HaftaSonu: boolean;
        Gelen: number;
        Izinli: number;
        Gelmeyen: number;
      }[]
    | null;
};

export type EtiketSayi = { Etiket: string; Sayi: number };

export type PersonelTarih = { IDSubePersonel: string; AdSoyad: string; Tarih: string };

export type PdksKisi = { IDSubePersonel: string; AdSoyad: string; Giris: string };

export type BekleyenTalep = {
  Tip: "izin" | "avans";
  IDSubePersonel: string;
  AdSoyad: string;
  Tarih: string | null;
  IzinTipi: string | null;
  Gun: number | null;
  Tutar: number | null;
};
