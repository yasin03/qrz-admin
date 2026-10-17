"use client";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadBlob } from "@/components/export/types";
import {
  createStyledQr,
  generateQrPayload,
  getStyledQrPngBlob,
  type LokasyonQrData,
} from "@/lib/qr-utils";

import { getQrA4Content } from "./qr-a4-content";
import { downloadQrA4Pdf } from "./qr-a4-pdf";
import { downloadQrA4Docx } from "./qr-a4-docx";

type DownloadType = "png" | "pdf" | "docx";

interface QrKodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: LokasyonQrData | null;
}

const PREVIEW_SIZE = 240;

export function QrKodDialog({ open, onOpenChange, data }: QrKodDialogProps) {
  // useRef değil state: Dialog içeriği Portal ile bir render SONRA DOM'a
  // ekleniyor; ref nesnesi effect anında henüz null oluyor ve değişince
  // effect'i tetiklemiyordu. Callback ref + state ile div eklendiği an
  // effect yeniden çalışıyor.
  const [previewEl, setPreviewEl] = useState<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState<DownloadType | null>(null);

  const qrValue = data ? generateQrPayload(data) : "";

  // Önizleme: şekilli QR'ı container'a çiz; lokasyon değişince / dialog
  // kapanınca temizle.
  useEffect(() => {
    if (!previewEl || !qrValue) return;

    let cancelled = false;

    createStyledQr(qrValue, PREVIEW_SIZE).then((qr) => {
      if (cancelled) return;
      previewEl.innerHTML = "";
      qr.append(previewEl);
    });

    return () => {
      cancelled = true;
      previewEl.innerHTML = "";
    };
  }, [previewEl, qrValue]);

  if (!data) return null;

  const fileName = `qr-${data.LokasyonAdi ?? data.IDBolumLokasyon}`;

  const handleDownload = async (type: DownloadType) => {
    setDownloading(type);
    try {
      if (type === "png") {
        const blob = await getStyledQrPngBlob(qrValue, 1024);
        downloadBlob(blob, `${fileName}.png`);
      } else {
        const content = await getQrA4Content(data);
        if (type === "pdf") {
          await downloadQrA4Pdf(content, qrValue, fileName);
        } else {
          await downloadQrA4Docx(content, qrValue, fileName);
        }
      }
    } catch (error) {
      console.error("QR indirme hatası", error);
      toast.error("QR kod indirilemedi", {
        description: "Lütfen tekrar deneyiniz.",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Kod</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div
            ref={setPreviewEl}
            className="flex items-center justify-center rounded-2xl border bg-white p-3"
            style={{ width: PREVIEW_SIZE + 26, height: PREVIEW_SIZE + 26 }}
          />

          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p className="text-xl">{data.LokasyonAdi}</p>
            <p>{data.BolumAdi}</p>
            <p>
              Enlem: {data.Enlem} / Boylam: {data.Boylam}
            </p>
          </div>
        </div>

        <DialogFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full h-12" disabled={downloading !== null}>
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {downloading ? "Hazırlanıyor..." : "İndir"}
                <ChevronDown className="ml-auto size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-(--radix-dropdown-menu-trigger-width)"
            >
              <DropdownMenuLabel>QR Kod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDownload("png")}>
                <ImageIcon className="size-4" />
                Sadece QR (PNG)
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>A4 Sayfa</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                <FileText className="size-4" />
                A4 Sayfa (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("docx")}>
                <FileText className="size-4" />
                A4 Sayfa (Word)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
