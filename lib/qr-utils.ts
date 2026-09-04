export interface LokasyonQrData {
  IDBolumLokasyon: string;
  IDBolum: string;
  BolumAdi?: string;
  LokasyonAdi?: string;
  Enlem: string;
  Boylam: string;
  Aktif?: boolean;
}

export interface QrPayload {
  IDBolumLokasyon: string;
  IDBolum: string;
  Enlem: string;
  Boylam: string;
}

/**
 * Sadece telefonun ihtiyaç duyduğu alanları QR payload'ına koyuyoruz
 * (BolumAdi, LokasyonAdi gibi görsel alanları QR'a gömmüyoruz, kod boyutunu şişirmesin)
 */
/* export function generateQrPayload(data: LokasyonQrData): string {
  const payload: QrPayload = {
    IDBolumLokasyon: data.IDBolumLokasyon,
    IDBolum: data.IDBolum,
    Enlem: data.Enlem,
    Boylam: data.Boylam,
  };

  return JSON.stringify(payload);
} */

export function generateQrPayload(data: LokasyonQrData): string {
  return [data.IDBolumLokasyon, data.IDBolum, data.Enlem, data.Boylam].join(
    "|",
  );
}
