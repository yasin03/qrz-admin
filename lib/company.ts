export interface CompanyInfo {
  name: string;
  address: string;
  phone?: string;
  /**
   * public/ klasörü altındaki logo dosyasının yolu, örn. "/logo.png".
   * PDF (react-pdf) ve DOCX (docx) export'ları bunu fetch edip base64/ArrayBuffer'a çevirir.
   */
  logoPath: string;
}

export const COMPANY_INFO: CompanyInfo = {
  name: "Şirket Adınız",
  address: "Adres bilgisi, İlçe/Şehir",
  phone: "+90 5xx xxx xx xx",
  logoPath: "/logo.png",
};

let cachedDataUri: string | null = null;
let cachedArrayBuffer: ArrayBuffer | null = null;

/**
 * @react-pdf/renderer için: logo görselini data-uri (base64) olarak döner.
 * Sonuç aynı sekme oturumunda cache'lenir, her export'ta tekrar indirilmez.
 */
export async function getLogoDataUri(): Promise<string> {
  if (cachedDataUri) return cachedDataUri;

  const response = await fetch(COMPANY_INFO.logoPath);
  if (!response.ok) {
    throw new Error("Logo dosyası okunamadı: " + COMPANY_INFO.logoPath);
  }
  const blob = await response.blob();

  cachedDataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Logo base64'e çevrilemedi"));
    reader.readAsDataURL(blob);
  });

  return cachedDataUri;
}

/**
 * docx (Word) için: logo görselini ArrayBuffer olarak döner (ImageRun bunu bekliyor).
 */
export async function getLogoArrayBuffer(): Promise<ArrayBuffer> {
  if (cachedArrayBuffer) return cachedArrayBuffer;

  const response = await fetch(COMPANY_INFO.logoPath);
  if (!response.ok) {
    throw new Error("Logo dosyası okunamadı: " + COMPANY_INFO.logoPath);
  }
  cachedArrayBuffer = await response.arrayBuffer();
  return cachedArrayBuffer;
}
