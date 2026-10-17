import { fetchContext } from "@/hooks/use-context";
import type { LokasyonQrData } from "@/lib/qr-utils";

// A4 QR sayfasının (PDF ve Word) ortak içeriği.

export const QR_A4_LOGO_PATH = "/logos/logo-pri.png";
export const QR_A4_TALIMAT =
  "QR-Zaman uygulamasını açın ve giriş / çıkış için bu kodu okutun.";
export const QR_A4_SLOGAN = "QR-ZAMAN · PERSONEL TAKİBİNİN AKILLI YOLU";

export type QrA4Content = {
  sirketAdi: string;
  subeAdi: string;
  lokasyonAdi: string;
  bolumAdi: string;
};

/**
 * Lokasyon bilgisi + seçili çalışma bağlamındaki şirket/şube adı.
 * (Adres/telefon bağlamda olmadığı için sayfada yer almıyor.)
 */
export async function getQrA4Content(
  data: LokasyonQrData,
): Promise<QrA4Content> {
  const context = await fetchContext().catch(() => null);

  return {
    sirketAdi: context?.SirketAdi ?? "",
    subeAdi: context?.SubeAdi ?? "",
    lokasyonAdi: data.LokasyonAdi || "Lokasyon",
    bolumAdi: data.BolumAdi ?? "",
  };
}
