"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseExcelFile } from "@/components/export/exporters/import-parser";
import {
  useImportPersonel,
  type PersonelImportRow,
  type PersonelImportSummary,
} from "@/hooks/use-personel";
import { cn } from "@/lib/utils";

const SABLON_URL = "/templates/Personel_Sablon.xlsx";
const ACCEPTED_EXTENSIONS = [".xlsx"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Progress = { done: number; total: number };

/** ExcelJS hücre değerini (tarih, formül, zengin metin, link) düz değere çevirir */
function normalizeCellValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    if ("result" in value) return normalizeCellValue(value.result);
    if ("richText" in value && Array.isArray(value.richText)) {
      return normalizeCellValue(
        value.richText.map((part: { text: string }) => part.text).join(""),
      );
    }
    if ("text" in value) return normalizeCellValue(value.text);
  }
  return String(value);
}

function normalizeRows(rows: Record<string, unknown>[]): PersonelImportRow[] {
  return rows
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          normalizeCellValue(value),
        ]),
      ),
    )
    .filter((row) => Object.values(row).some((value) => value !== null));
}

function getRowLabel(row: PersonelImportRow) {
  const adSoyad = [row.Ad, row.Soyad].filter(Boolean).join(" ");
  return [adSoyad, row.TcKimlikNo].filter(Boolean).join(" · ") || "-";
}

export default function PersonelImportDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [summary, setSummary] = useState<PersonelImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportPersonel();
  const isImporting = importMutation.isPending;

  const handleOpenChange = (value: boolean) => {
    if (isImporting) return;
    if (!value) {
      setFile(null);
      setIsDragging(false);
      setProgress(null);
      setSummary(null);
    }
    onOpenChange(value);
  };

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    const isValid = ACCEPTED_EXTENSIONS.some((ext) =>
      selected.name.toLowerCase().endsWith(ext),
    );
    if (!isValid) {
      toast.error("Yalnızca .xlsx uzantılı Excel dosyaları yüklenebilir.");
      return;
    }
    setFile(selected);
  };

  const handleImport = async () => {
    if (!file) return;

    let rows: PersonelImportRow[];
    try {
      rows = normalizeRows(await parseExcelFile(file));
    } catch (error) {
      console.error(error);
      toast.error("Dosya okunurken bir hata oluştu.");
      return;
    }

    if (rows.length === 0) {
      toast.error("Dosyada aktarılacak personel satırı bulunamadı.");
      return;
    }

    setProgress({ done: 0, total: rows.length });
    const result = await importMutation.mutateAsync({
      rows,
      onProgress: (done, total) => setProgress({ done, total }),
    });

    console.log("İçe aktarım sonucu:", result);
    setSummary(result);
    setProgress(null);
  };

  const resetForNewFile = () => {
    setFile(null);
    setSummary(null);
  };

  const progressPercent = progress
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Personel İçe Aktar</DialogTitle>
          <DialogDescription>
            Personel bilgilerini şablona uygun Excel dosyası ile toplu olarak
            ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {summary ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                <CheckCircle2 className="size-6 shrink-0 text-success" />
                <div>
                  <p className="text-2xl font-semibold leading-none">
                    {summary.success}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Başarılı</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <XCircle className="size-6 shrink-0 text-destructive" />
                <div>
                  <p className="text-2xl font-semibold leading-none">
                    {summary.failed}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Başarısız
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Toplam {summary.total} satır işlendi.
            </p>

            {summary.failures.length > 0 && (
              <div className="rounded-lg border">
                <p className="border-b px-3 py-2 text-xs font-medium">
                  Aktarılamayan kayıtlar
                </p>
                <ul className="max-h-48 divide-y overflow-y-auto">
                  {summary.failures.map((failure, index) => (
                    <li key={index} className="px-3 py-2">
                      <p className="truncate font-medium">
                        {getRowLabel(failure.row)}
                      </p>
                      <p className="text-xs text-destructive">
                        {failure.message}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : progress ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Loader2 className="size-4 animate-spin" />
                Personeller aktarılıyor...
              </span>
              <span className="text-muted-foreground">
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              İşlem tamamlanana kadar bu pencereyi kapatmayın.
            </p>
          </div>
        ) : (
          <>
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  appearance="ghost"
                  size="icon-sm"
                  onClick={() => setFile(null)}
                >
                  <X />
                  <span className="sr-only">Dosyayı kaldır</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  selectFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors outline-none hover:border-primary/50 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50",
                  isDragging && "border-primary bg-primary/5",
                )}
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="size-5" />
                </div>
                <p className="font-medium">
                  Excel dosyasını sürükleyin veya seçmek için tıklayın
                </p>
                <p className="text-xs text-muted-foreground">
                  Yalnızca .xlsx dosyaları desteklenir
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => {
                selectFile(e.target.files?.[0]);
                e.target.value = ""; // aynı dosyayı tekrar seçebilmek için sıfırla
              }}
            />

            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Dosyanızı hazırlamak için örnek şablonu kullanın.
              </p>
              <Button type="button" appearance="outline" size="sm" asChild>
                <a href={SABLON_URL} download="Personel_Sablon.xlsx">
                  <Download className="size-4" />
                  Şablonu İndir
                </a>
              </Button>
            </div>
          </>
        )}

        <DialogFooter>
          {summary ? (
            <>
              <Button
                type="button"
                variant="secondary"
                appearance="outline"
                onClick={resetForNewFile}
              >
                Yeni Dosya Yükle
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Kapat
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                appearance="outline"
                disabled={isImporting}
                onClick={() => handleOpenChange(false)}
              >
                İptal
              </Button>
              <Button
                type="button"
                disabled={!file || isImporting}
                onClick={handleImport}
              >
                {isImporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                İçe Aktar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
