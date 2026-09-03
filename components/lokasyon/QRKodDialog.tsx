"use client";
import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateQrPayload, type LokasyonQrData } from "@/lib/qr-utils";

interface QrKodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: LokasyonQrData | null;
}

export function QrKodDialog({ open, onOpenChange, data }: QrKodDialogProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const qrValue = generateQrPayload(data);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${data.LokasyonAdi ?? data.IDBolumLokasyon}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{data.LokasyonAdi ?? "QR Kod"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={canvasRef} className="rounded-lg border p-4 bg-white">
            <QRCodeCanvas
              value={qrValue}
              size={220}
              level="M"
              includeMargin
            />
          </div>

          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>{data.BolumAdi}</p>
            <p>
              Enlem: {data.Enlem} / Boylam: {data.Boylam}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            PNG Olarak İndir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}