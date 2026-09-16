"use client";

import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  Upload,
} from "lucide-react";
// Projede kullanılan toast kütüphanesi neyse onunla değiştirin (sonner örnek olarak kullanıldı)
import { toast } from "sonner";
import { ExportFormat, ExportMenuProps, ExportOrientation } from "./types";
import { exportToPdf } from "./exporters/pdf-exporter";
import { exportToDocx } from "./exporters/docx-exporter";
import { exportToXlsx } from "./exporters/xlsx-exporter";
import { exportToReport } from "./exporters/report-exporter";
import { parseImportFile } from "./exporters/import-parser";

export function ExportMenu<T>({
  data,
  exportColumns,
  title,
  fileName,
  defaultOrientation,
  showImport = false,
  onImport,
}: ExportMenuProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [orientation, setOrientation] = useState<ExportOrientation>(
    defaultOrientation ?? (exportColumns.length > 6 ? "landscape" : "portrait")
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meta = { title, fileName, orientation };

  async function handleExport(format: ExportFormat) {
    if (data.length === 0) {
      toast.error("Aktarılacak veri bulunamadı");
      return;
    }

    setIsExporting(true);
    try {
      switch (format) {
        case "pdf":
          await exportToPdf(data, exportColumns, meta);
          break;
        case "docx":
          await exportToDocx(data, exportColumns, meta);
          break;
        case "xlsx":
          await exportToXlsx(data, exportColumns, meta);
          break;
        case "report":
          exportToReport(data, exportColumns, meta);
          break;
      }
    } catch (error) {
      console.error(error);
      toast.error("Aktarım sırasında bir hata oluştu");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // aynı dosyayı tekrar seçebilmek için sıfırla
    if (!file) return;

    try {
      const rows = await parseImportFile(file);
      onImport?.(rows);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Dosya okunamadı");
    }
  }

  return (
    <div className="shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" appearance="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Aktar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Sayfa Yönü</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={orientation}
            onValueChange={(value) => setOrientation(value as ExportOrientation)}
          >
            <DropdownMenuRadioItem value="portrait">
              <RectangleVertical className="size-4" />
              Dikey
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="landscape">
              <RectangleHorizontal className="size-4" />
              Yatay
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

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
          <DropdownMenuItem onClick={() => handleExport("report")}>
            <ClipboardList className="size-4" />
            Rapor oluştur
          </DropdownMenuItem>

          {showImport && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" />
                İçe aktar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showImport && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.pdf"
          className="hidden"
          onChange={handleImportFile}
        />
      )}
    </div>
  );
}