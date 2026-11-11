"use client";

import { useMemo, useState } from "react";
import { Copy, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBordroLog } from "@/modules/bordro/hooks/use-bordro";
import { parseLogLines } from "./bordro-rapor-fields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idSubePersonel: string | number;
  yil: string;
  ay: string;
  adSoyad?: string;
  /** "Kasım 2026" */
  donem: string;
};

/** Personelin bordro hesaplama log kayıtları (rapor modalının üstünde açılır). */
const BordroLogModal = ({
  open,
  onOpenChange,
  idSubePersonel,
  yil,
  ay,
  adSoyad,
  donem,
}: Props) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const { data: logRows = [], isFetching } = useBordroLog(
    { IDSubePersonel: idSubePersonel, Yil: yil, Ay: ay },
    open,
  );

  const logLines = useMemo(() => parseLogLines(logRows), [logRows]);
  const hasLogLines = logLines.some(Boolean);

  const handleKopyala = async () => {
    try {
      await navigator.clipboard.writeText(logLines.join("\n"));
      toast.success("Log içeriği kopyalandı.");
    } catch (error) {
      console.error(error);
      toast.error("İçerik kopyalanamadı.");
    }
  };

  const handlePdfIndir = async () => {
    setIsPdfLoading(true);
    try {
      const { exportTextToPdf } = await import(
        "@/components/export/exporters/text-pdf-exporter"
      );
      await exportTextToPdf(
        {
          title: "Bordro Log Kayıtları",
          subtitle: [
            adSoyad ? `Personel: ${adSoyad}` : "",
            donem ? `Dönem: ${donem}` : "",
          ].filter(Boolean),
          lines: logLines,
        },
        `bordro-log-${(adSoyad || "personel")
          .toLocaleLowerCase("tr-TR")
          .replace(/\s+/g, "-")}`,
      );
    } catch (error) {
      console.error(error);
      toast.error("PDF oluşturulamadı.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Bordro Log Kayıtları{adSoyad ? ` — ${adSoyad}` : ""}
          </DialogTitle>
          {donem && <DialogDescription>{donem}</DialogDescription>}
        </DialogHeader>

        {isFetching ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : !hasLogLines ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Log kaydı bulunamadı.
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
            {logLines.map((line, i) =>
              line ? (
                <div
                  key={i}
                  className="border-b border-border/60 py-1.5 wrap-break-word last:border-b-0"
                >
                  {line}
                </div>
              ) : (
                <div key={i} className="h-3" />
              ),
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            appearance="outline"
            onClick={handleKopyala}
            disabled={isFetching || !hasLogLines}
          >
            <Copy className="size-4" />
            İçeriği Kopyala
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handlePdfIndir}
            disabled={isFetching || !hasLogLines || isPdfLoading}
          >
            {isPdfLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            PDF İndir
          </Button>
          <Button
            type="button"
            variant="secondary"
            appearance="outline"
            onClick={() => onOpenChange(false)}
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BordroLogModal;
