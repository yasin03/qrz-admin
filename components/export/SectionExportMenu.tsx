"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SectionExportDocument, SectionExportFormat } from "./section-types";

type Props = {
  /**
   * Export anında çağrılır; sayfa o anki filtreye göre belgeyi üretir.
   * null dönerse aktarılacak veri yok kabul edilir.
   */
  getDocument: () => SectionExportDocument | null;
  /** İndirilecek dosya adı (uzantısız) */
  fileName: string;
  /** Menünün üstünde gösterilecek bilgi, ör. "5 bölüm aktarılacak" */
  description?: string;
};

/**
 * Tablo olmayan, bölüm bölüm alan/değer gösteren sayfalar için "Aktar" menüsü.
 * Exporter'lar (react-pdf, docx, exceljs) büyük olduğu için ancak tıklanınca
 * yükleniyor.
 */
export function SectionExportMenu({ getDocument, fileName, description }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: SectionExportFormat) {
    const doc = getDocument();
    if (!doc || doc.sections.length === 0) {
      toast.error("Aktarılacak veri bulunamadı");
      return;
    }

    setIsExporting(true);
    try {
      switch (format) {
        case "pdf": {
          const { exportSectionsToPdf } = await import(
            "./exporters/section-pdf-exporter"
          );
          await exportSectionsToPdf(doc, fileName);
          break;
        }
        case "docx": {
          const { exportSectionsToDocx } = await import(
            "./exporters/section-docx-exporter"
          );
          await exportSectionsToDocx(doc, fileName);
          break;
        }
        case "xlsx": {
          const { exportSectionsToXlsx } = await import(
            "./exporters/section-xlsx-exporter"
          );
          await exportSectionsToXlsx(doc, fileName);
          break;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Aktarım sırasında bir hata oluştu");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" appearance="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="hidden sm:inline">Aktar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Dışa Aktar</DropdownMenuLabel>
        {description && (
          <p className="px-2 pb-1.5 text-xs text-muted-foreground">{description}</p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="size-4" />
          PDF indir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("docx")}>
          <FileText className="size-4" />
          Word indir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="size-4" />
          Excel indir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
