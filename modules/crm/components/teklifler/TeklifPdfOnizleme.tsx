"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { downloadBlob } from "@/components/export/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EkstrePdfVeri } from "@/modules/crm/types/finans";
import type { BelgePdfVeri } from "@/modules/crm/types/teklif";

// PDF modülü (@react-pdf) ağır; sadece gerektiğinde yüklenir.
const pdfModulu = () => import("@/modules/crm/lib/teklif-pdf");

/** Teklif / satış PDF'ini üretir. */
export async function belgePdfOlustur(veri: BelgePdfVeri) {
  const { belgePdfBlob } = await pdfModulu();
  return belgePdfBlob(veri);
}

/** Hesap ekstresi PDF'ini üretir. */
export async function ekstrePdfOlustur(veri: EkstrePdfVeri) {
  const { ekstrePdfBlob } = await pdfModulu();
  return ekstrePdfBlob(veri);
}

/** Önizlenecek PDF: teklif / satış belgesi ya da hesap ekstresi. */
export type PdfKaynak = { tur: "belge"; veri: BelgePdfVeri } | { tur: "ekstre"; veri: EkstrePdfVeri };

const pdfOlustur = (k: PdfKaynak) => (k.tur === "ekstre" ? ekstrePdfOlustur(k.veri) : belgePdfOlustur(k.veri));

/** PDF'i görünmez bir iframe'de açıp tarayıcının yazdırma penceresini gösterir. */
export function pdfYazdir(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Bazı tarayıcılar iframe'den yazdırmaya izin vermiyor → yeni sekme.
      window.open(url, "_blank");
    }
    // Yazdırma penceresi kapanana kadar iframe dursun.
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  document.body.appendChild(iframe);
}

/**
 * Veri değiştikçe (300 ms bekleyerek) PDF'i yeniden üretir ve blob URL'si
 * döner. Önceki URL serbest bırakılır.
 */
function usePdfOnizleme(kaynak: PdfKaynak | null) {
  const [durum, setDurum] = useState<{ url: string | null; blob: Blob | null; hata: string | null }>({
    url: null,
    blob: null,
    hata: null,
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const urlRef = useRef<string | null>(null);
  // Nesne kimliği her render'da değişebilir; içerik değişince üret.
  const anahtar = kaynak ? JSON.stringify(kaynak) : null;

  useEffect(() => {
    if (!anahtar) return;
    let iptal = false;
    const zamanlayici = setTimeout(async () => {
      setYukleniyor(true);
      try {
        const blob = await pdfOlustur(JSON.parse(anahtar) as PdfKaynak);
        if (iptal) return;
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setDurum({ url, blob, hata: null });
      } catch (error) {
        if (!iptal) setDurum((d) => ({ ...d, hata: (error as Error)?.message || "PDF oluşturulamadı." }));
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }, 300);
    return () => {
      iptal = true;
      clearTimeout(zamanlayici);
    };
  }, [anahtar]);

  // Bileşen kalkınca son URL serbest bırakılır.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  return { ...durum, yukleniyor: yukleniyor || (!!anahtar && !durum.url && !durum.hata) };
}

type Props = {
  /** Teklif / satış belgesi. */
  veri?: BelgePdfVeri | null;
  /** Hesap ekstresi (verilirse `veri` yerine). */
  ekstre?: EkstrePdfVeri | null;
  dosyaAdi: string;
  className?: string;
  /** Önizleme alanının yüksekliği. */
  yukseklik?: string;
};

/** PDF önizleme + İndir / Yazdır / Yeni sekmede aç (teklif, satış ve hesap ekstresi ortak). */
export function TeklifPdfOnizleme({ veri, ekstre, dosyaAdi, className, yukseklik = "h-[65svh]" }: Props) {
  const kaynak: PdfKaynak | null = ekstre
    ? { tur: "ekstre", veri: ekstre }
    : veri
      ? { tur: "belge", veri }
      : null;
  const { url, blob, hata, yukleniyor } = usePdfOnizleme(kaynak);

  const yazdir = () => {
    if (!blob) return;
    try {
      pdfYazdir(blob);
    } catch {
      toast.error("Yazdırma başlatılamadı.");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {yukleniyor && <Loader2 className="size-3.5 animate-spin" />}
          {yukleniyor ? "PDF hazırlanıyor..." : hata ? "" : "Önizleme"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            appearance="outline"
            disabled={!url}
            onClick={() => url && window.open(url, "_blank")}
          >
            <ExternalLink /> Yeni Sekmede Aç
          </Button>
          <Button type="button" size="sm" appearance="outline" disabled={!blob} onClick={yazdir}>
            <Printer /> Yazdır
          </Button>
          <Button type="button" size="sm" disabled={!blob} onClick={() => blob && downloadBlob(blob, dosyaAdi)}>
            <Download /> İndir
          </Button>
        </div>
      </div>

      <div className={cn("relative overflow-hidden rounded-lg border bg-muted/30", yukseklik)}>
        {hata ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-destructive">{hata}</div>
        ) : url ? (
          <iframe src={url} title="PDF önizleme" className="size-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
