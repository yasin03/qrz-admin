import { normalize } from "@/lib/utils";
import { fetchContext } from "@/modules/core/hooks/use-context";

export interface CompanyInfo {
  name: string;
  /** "Adres, İlçe / İl" */
  address: string;
  phone?: string;
  email?: string;
  /**
   * public/ klasörü altındaki logo dosyasının yolu, örn. "/logo.png".
   * Boşsa export'lar logosuz oluşturulur.
   */
  logoPath: string;
}

// Procedure alan tiplerinde tutarsız: IlceKodu sayı (25), IlKodu "003"
// gibi metin dönebiliyor; e-posta alanı "EPostaAdresi" olarak geliyor.
type Deger = string | number | null | undefined;
type SirketDetay = {
  SirketAdi?: Deger;
  SirketAdresi?: Deger;
  IlKodu?: Deger;
  IlceKodu?: Deger;
  Tel?: Deger;
  CepTel?: Deger;
  EPostaAdresi?: Deger;
  EpostaAdresi?: Deger;
};

type IlRow = { IlKodu: Deger; IlAdi: Deger };
type IlceRow = { IlceKodu: Deger; IlceAdi?: Deger; IlAdi?: Deger };

const TURKIYE_ID_ULKE = "38";
// Şirket bilgisi nadiren değişir; art arda alınan export'lar yeniden istek atmasın
const COMPANY_CACHE_TTL = 5 * 60 * 1000;
const companyCache = new Map<string, { at: number; info: CompanyInfo }>();

async function postJson(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("İstek başarısız: " + url);
  return response.json();
}

/** API listeleri bazen [[...]] bazen [...] dönüyor */
function toList<T>(data: unknown): T[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  return (Array.isArray(data[0]) ? data[0] : data) as T[];
}

const clean = (value: Deger) => String(value ?? "").trim();

/** "003" ile 3, "25" ile 25 aynı kod sayılsın */
const sameCode = (a: Deger, b: Deger) => {
  const x = clean(a);
  const y = clean(b);
  if (!x || !y) return false;
  return x === y || (/^\d+$/.test(x) && /^\d+$/.test(y) && Number(x) === Number(y));
};

/** İl/ilçe kodlarından adları bulur; bulunamazsa boş döner (export'u engellemez) */
async function fetchIlIlceAdlari(ilKodu: string, ilceKodu: string) {
  if (!ilKodu) return { il: "", ilce: "" };

  const [iller, ilceler] = await Promise.all([
    postJson("/api/genel", { type: "GET_ILLER", IDUlke: TURKIYE_ID_ULKE })
      .then((data) => toList<IlRow>(data))
      .catch(() => []),
    ilceKodu
      ? postJson("/api/genel", { type: "GET_ILCELER", IlKodu: ilKodu })
          .then((data) => toList<IlceRow>(data))
          .catch(() => [])
      : Promise.resolve([] as IlceRow[]),
  ]);

  const il = iller.find((row) => sameCode(row.IlKodu, ilKodu))?.IlAdi;
  const ilceRow = ilceler.find((row) => sameCode(row.IlceKodu, ilceKodu));
  const ilAdi = clean(il);
  let ilceAdi = clean(ilceRow?.IlceAdi ?? ilceRow?.IlAdi);
  // İlçe adı bazen il adını da içeriyor ("AFYONKARAHISAR MERKEZ"); adreste
  // "AFYONKARAHISAR MERKEZ / AFYONKARAHİSAR" tekrarı olmasın. Karşılaştırma
  // Türkçe harf farklarına duyarsız (İ/I).
  if (ilAdi && normalize(ilceAdi).startsWith(normalize(ilAdi) + " ")) {
    ilceAdi = ilceAdi.slice(ilAdi.length).trim();
  }
  return { il: ilAdi, ilce: ilceAdi };
}

/**
 * Export belgelerinin başlığındaki şirket bilgisi: seçili çalışma
 * bağlamındaki şirketin kaydından (Sirket_SELECTByIDSirket) ad, adres,
 * telefon ve e-posta. Detay alınamazsa sadece bağlamdaki şirket adıyla
 * devam edilir — export hiçbir zaman bu yüzden başarısız olmaz.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const context = await fetchContext().catch(() => null);
  const fallback: CompanyInfo = {
    name: context?.SirketAdi ?? "",
    address: "",
    logoPath: "",
  };

  const idSirket = context?.IDSirket ? String(context.IDSirket) : "";
  if (!idSirket) return fallback;

  const cached = companyCache.get(idSirket);
  if (cached && Date.now() - cached.at < COMPANY_CACHE_TTL) return cached.info;

  try {
    const detay = toList<SirketDetay>(
      await postJson("/api/kurumsal/sirket", {
        type: "GET_SIRKET_DETAY",
        IDSirket: idSirket,
      }),
    )[0];
    if (!detay) return fallback;
    const { il, ilce } = await fetchIlIlceAdlari(
      clean(detay.IlKodu),
      clean(detay.IlceKodu),
    );
    const ilIlce = [ilce, il].filter(Boolean).join(" / ");

    const info: CompanyInfo = {
      name: fallback.name || clean(detay.SirketAdi),
      address: [clean(detay.SirketAdresi), ilIlce].filter(Boolean).join(", "),
      phone: clean(detay.Tel) || clean(detay.CepTel),
      email: clean(detay.EPostaAdresi) || clean(detay.EpostaAdresi),
      logoPath: "",
    };

    companyCache.set(idSirket, { at: Date.now(), info });
    return info;
  } catch {
    return fallback;
  }
}

/** Başlıktaki iletişim satırı: "Tel: 0272 ... · E-posta: info@..." */
export function getCompanyContactLine(company: CompanyInfo) {
  return [
    company.phone && `Tel: ${company.phone}`,
    company.email && `E-posta: ${company.email}`,
  ]
    .filter(Boolean)
    .join(" · ");
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
