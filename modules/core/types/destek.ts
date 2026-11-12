// ---- Destek Talepleri ----------------------------------------------------

export type DestekTalepDurumu = "AÇIK" | "KAPALI";
export type DestekTalepOncelik = "Yüksek" | "Orta" | "Düşük";

export type DestekTalepType = {
  IDDestekTakip: string;
  IDDestekTakipKonu: string;
  Konu: string;
  Baslik: string;
  Oncelik: DestekTalepOncelik;
  Durumu: DestekTalepDurumu;
  OlusturmaTarihi: string; // ISO
  OlusturanIDKullanici: string;
  KullaniciAdi: string;
  SirketAdi: string;
  GurupAdi: string;
  Okundu: boolean;
};

export type DestekTalepFilters = {
  Durumu: DestekTalepDurumu | "ALL";
  Oncelik: DestekTalepOncelik | "ALL";
  Konu: string; // "ALL" | Konu
};

// ---- Konular -------------------------------------------------------------

export type DestekKonuType = {
  IDDestekTakipKonu: string;
  Konu: string;
};

// ---- Ekleme / Güncelleme --------------------------------------------------

export type DestekDosyaType = {
  fileName: string;
  fileSize: number;
  base64: string; // data: prefix'i olmadan
};

// IDKullanici route'ta session'dan set ediliyor. IDSirket yalnızca admin
// için dikkate alınıyor; diğer kullanıcılarda session'daki şirket kullanılır.
export type DestekTalepInsertRequestType = {
  DestekTakipBirimi: string;
  IDAnaUygulama: string;
  IDDestekTakipKonu: string;
  IDSirket?: string;
  Oncelik: DestekTalepOncelik;
  Baslik: string;
  Mesaj: string;
  Dosya: string; // JSON.stringify(DestekDosyaType[])
};

export type DestekTalepResponseType = {
  test?: number | string;
};

// ---- Silme (yalnızca Admin) ---------------------------------------------------

export type DestekTalepDeleteRequestType = {
  IDDestekTakip: string;
};

// ---- Durum değiştirme (yalnızca Admin) -------------------------------------

export type DestekTalepDurumRequestType = {
  IDDestekTakip: string;
  Durumu: DestekTalepDurumu;
};

// ---- Mesajlar ------------------------------------------------------------

export type DestekMesajType = {
  IDDestekTakipMesaj: string;
  IDDestekTakip: string;
  IDKullanici: string;
  Mesaj: string;
  Tarih: string; // ISO
  KullaniciAdi: string;
  Okundu: boolean;
  jsonDosya: string | null; // JSON.stringify(DestekDosyaType[])
};

// IDKullanici route'ta session'dan set ediliyor.
export type DestekMesajInsertRequestType = {
  IDDestekTakip: string;
  Mesaj: string;
  Dosya: string; // JSON.stringify(DestekDosyaType[])
};
