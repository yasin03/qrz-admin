import { fetchContext } from "@/hooks/use-context";

export interface CompanyInfo {
  name: string;
  address: string;
  phone?: string;
  /**
   * public/ klasörü altındaki logo dosyasının yolu, örn. "/logo.png".
   * Boşsa export'lar logosuz oluşturulur.
   */
  logoPath: string;
}

/**
 * Export belgelerinin başlığındaki şirket bilgisi. Şirket adı seçili çalışma
 * bağlamından (grsisudo / savedContext) okunur; adres, telefon ve logo henüz
 * bağlamda olmadığı için şimdilik boş.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const context = await fetchContext().catch(() => null);

  return {
    name: context?.SirketAdi ?? "",
    address: "",
    phone: "",
    logoPath: "",
  };
}

const dataUriCache = new Map<string, string>();
const arrayBufferCache = new Map<string, ArrayBuffer>();

async function fetchLogo(logoPath: string): Promise<Response> {
  if (!logoPath) throw new Error("Logo tanımlı değil");

  const response = await fetch(logoPath);
  if (!response.ok) {
    throw new Error("Logo dosyası okunamadı: " + logoPath);
  }
  return response;
}

/**
 * @react-pdf/renderer için: logo görselini data-uri (base64) olarak döner.
 * Sonuç aynı sekme oturumunda cache'lenir, her export'ta tekrar indirilmez.
 */
export async function getLogoDataUri(logoPath: string): Promise<string> {
  const cached = dataUriCache.get(logoPath);
  if (cached) return cached;

  const blob = await (await fetchLogo(logoPath)).blob();
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Logo base64'e çevrilemedi"));
    reader.readAsDataURL(blob);
  });

  dataUriCache.set(logoPath, dataUri);
  return dataUri;
}

/**
 * docx (Word) ve exceljs için: logo görselini ArrayBuffer olarak döner.
 */
export async function getLogoArrayBuffer(logoPath: string): Promise<ArrayBuffer> {
  const cached = arrayBufferCache.get(logoPath);
  if (cached) return cached;

  const buffer = await (await fetchLogo(logoPath)).arrayBuffer();
  arrayBufferCache.set(logoPath, buffer);
  return buffer;
}
