import type QRCodeStyling from "qr-code-styling";

export interface LokasyonQrData {
  IDBolumLokasyon: string;
  IDBolum: string;
  BolumAdi?: string;
  LokasyonAdi?: string;
  Enlem: string;
  Boylam: string;
  Aktif?: boolean;
}

/**
 * Mobil uygulamanın okuduğu QR içeriği: "IDBolumLokasyon|IDBolum|Enlem|Boylam".
 * Görsel alanlar (BolumAdi, LokasyonAdi) QR'a gömülmüyor, kod boyutunu şişirmesin.
 */
export function generateQrPayload(data: LokasyonQrData): string {
  return [data.IDBolumLokasyon, data.IDBolum, data.Enlem, data.Boylam].join(
    "|",
  );
}

// ---- Şekilli QR (qr-code-styling) ------------------------------------------
// Marka renkleri (public/logos/logo-pri.svg) ile yuvarlak noktalı, köşe gözleri
// turkuaz, ortasında QR-Zaman ikonu olan QR. Ortadaki logo bazı modülleri
// kapattığı için hata düzeltme "H" (%30) seviyesinde.
//
// qr-code-styling tarayıcı API'si (canvas/window) kullanıyor; SSR'da import
// edilirse hata verir. Bu yüzden sadece fonksiyon içinde dinamik import ediliyor.

export const QR_BRAND_NAVY = "#092041";
export const QR_BRAND_CYAN = "#01BDE8";
const QR_LOGO_PATH = "/logos/icon-pri.png";

export async function createStyledQr(
  data: string,
  size: number,
): Promise<QRCodeStyling> {
  const { default: QRCodeStylingClass } = await import("qr-code-styling");

  return new QRCodeStylingClass({
    type: "canvas",
    width: size,
    height: size,
    margin: Math.round(size * 0.04),
    data,
    image: QR_LOGO_PATH,
    qrOptions: { errorCorrectionLevel: "H" },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.3,
      margin: Math.max(2, Math.round(size * 0.01)),
      crossOrigin: "anonymous",
    },
    dotsOptions: { type: "rounded", color: QR_BRAND_NAVY },
    cornersSquareOptions: { type: "extra-rounded", color: QR_BRAND_CYAN },
    cornersDotOptions: { type: "dot", color: QR_BRAND_NAVY },
    backgroundOptions: { color: "#FFFFFF" },
  });
}

/** Şekilli QR'ı PNG Blob olarak üretir (indirme ve PDF/Word'e gömmek için). */
export async function getStyledQrPngBlob(
  data: string,
  size: number,
): Promise<Blob> {
  const qr = await createStyledQr(data, size);
  const raw = await qr.getRawData("png");
  if (!(raw instanceof Blob)) {
    throw new Error("QR kod görseli oluşturulamadı.");
  }
  return raw;
}

/** @react-pdf/renderer'ın <Image>'ı için Blob -> data-uri. */
export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Görsel base64'e çevrilemedi"));
    reader.readAsDataURL(blob);
  });
}
