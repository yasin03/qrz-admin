"use client";

import { useState } from "react";
import { CheckCircle2, Filter, ScrollText, User, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { SectionExportMenu } from "@/components/export/SectionExportMenu";
import type { SectionExportDocument } from "@/components/export/section-types";
import { AY_DATA } from "@/constants/data";
import { useBordroRapor } from "@/modules/bordro/hooks/use-bordro";
import { cn } from "@/lib/utils";
import { BordroResponseType } from "@/modules/bordro/types/bordro";
import {
  PERSONAL_FIELDS,
  REPORT_GROUPS,
  RaporField,
  RaporValues,
  SUMMARY_TOTAL_FIELDS,
  formatTL,
  getVisibleFields,
  toFieldValue,
} from "./bordro-rapor-fields";
import BordroLogModal from "./BordroLogModal";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Listede tıklanan satır */
  kayit: BordroResponseType;
  yil: string;
  ay: string;
};

const RaporSection = ({
  title,
  icon: Icon,
  fields,
  values,
}: {
  title: string;
  icon: LucideIcon;
  fields: RaporField[];
  values: RaporValues;
}) => (
  <section className="rounded-xl border border-border bg-card">
    <header className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Icon className="size-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </header>
    <dl className="grid grid-cols-1 gap-x-6 px-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((f) => {
        const value = toFieldValue(values[f.key], f.type);
        return (
          <div
            key={f.key}
            className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-sm"
          >
            <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
            <dd className="min-w-0 text-right font-medium wrap-break-word tabular-nums text-foreground">
              {typeof value === "boolean" ? (
                value ? (
                  <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-3.5" /> Evet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <XCircle className="size-3.5" /> Hayır
                  </span>
                )
              ) : (
                (value ?? "-")
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  </section>
);

const BordroRaporModal = ({ open, onOpenChange, kayit, yil, ay }: Props) => {
  const [showPersonal, setShowPersonal] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [openLog, setOpenLog] = useState(false);

  const {
    data: rapor,
    isLoading,
    isError,
  } = useBordroRapor({ IDBordro: kayit.IDBordro }, open);

  const values = (rapor ?? {}) as RaporValues;
  const adSoyad = kayit.AdSoyad ?? "";
  const onayli = kayit.OnayTarihi != null;
  const donem = [AY_DATA.find((a) => a.value === ay)?.label, yil]
    .filter(Boolean)
    .join(" ");

  // Ekranda ve dışa aktarımda görünen bölümler (filtre uygulanmış)
  const visibleGroups = [
    ...(showPersonal
      ? [
          {
            key: "kisisel",
            title: "Kişisel Bilgiler",
            icon: User,
            // Kişisel bilgiler bakiye filtresine tabi değil
            fields: PERSONAL_FIELDS,
          },
        ]
      : []),
    ...REPORT_GROUPS.map((group) => ({
      ...group,
      fields: getVisibleFields(group.fields, values, showEmpty),
    })),
  ].filter((group) => group.fields.length > 0);

  const buildExportDocument = (): SectionExportDocument | null =>
    rapor
      ? {
          title: "Bordro Raporu",
          heading: adSoyad || "Personel",
          subheading: kayit.UnvanAdi || kayit.GorevAdi || null,
          tags: [
            donem,
            onayli ? "Onaylı" : "Onaysız",
            showEmpty ? "" : "Bakiyesi olmayan alanlar gösterilmemiştir",
          ].filter(Boolean),
          summary: SUMMARY_TOTAL_FIELDS.map((f) => ({
            label: f.label,
            value: formatTL(values[f.key]),
          })),
          sections: visibleGroups.map((group) => ({
            title: group.title,
            fields: group.fields.map((f) => ({
              label: f.label,
              value: toFieldValue(values[f.key], f.type),
            })),
          })),
        }
      : null;

  const exportFileName = `bordro-raporu-${(adSoyad || "personel")
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, "-")}-${yil}-${ay}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Bordro Raporu{adSoyad ? ` — ${adSoyad}` : ""}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-1.5">
              {donem}
              <Badge variant={onayli ? "success" : "gray"}>
                {onayli ? "Onaylı" : "Onaysız"}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Bordro raporu yüklenirken bir hata oluştu.
            </div>
          ) : !rapor ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Bordro raporu bulunamadı.
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              {/* Kontrol şeridi */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  appearance="outline"
                  onClick={() => setOpenLog(true)}
                  disabled={!kayit.IDSubePersonel}
                >
                  <ScrollText className="size-4" />
                  Log Göster
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      appearance="outline"
                      aria-label="Görünüm filtresi"
                    >
                      <Filter className="size-4" />
                      <span className="hidden sm:inline">Filtre</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 gap-3 p-3">
                    <div className="text-sm font-semibold">Görünüm</div>
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="bordro-rapor-kisisel">
                        Kişisel bilgileri göster
                      </Label>
                      <Switch
                        id="bordro-rapor-kisisel"
                        checked={showPersonal}
                        onCheckedChange={setShowPersonal}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="bordro-rapor-bos">
                        Bakiyesi olmayan alanları göster
                      </Label>
                      <Switch
                        id="bordro-rapor-bos"
                        checked={showEmpty}
                        onCheckedChange={setShowEmpty}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aktarım bu filtreye göre yapılır.
                    </p>
                  </PopoverContent>
                </Popover>

                <SectionExportMenu
                  getDocument={buildExportDocument}
                  fileName={exportFileName}
                  description={`${visibleGroups.length} bölüm aktarılacak`}
                />
              </div>

              {/* Her zaman görünen özet toplamlar */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {SUMMARY_TOTAL_FIELDS.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase">
                      <Icon className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="truncate text-base font-bold tabular-nums text-foreground sm:text-lg">
                      {formatTL(values[key])}
                    </span>
                  </div>
                ))}
              </div>

              {visibleGroups.map((group) => (
                <RaporSection
                  key={group.key}
                  title={group.title}
                  icon={group.icon}
                  fields={group.fields}
                  values={values}
                />
              ))}

              {visibleGroups.length === 0 && (
                <div
                  className={cn(
                    "rounded-xl border border-dashed border-border bg-card p-6",
                    "text-center text-sm text-muted-foreground",
                  )}
                >
                  Bakiyesi olan alan bulunamadı.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
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

      {openLog && (
        <BordroLogModal
          open={openLog}
          onOpenChange={setOpenLog}
          idSubePersonel={kayit.IDSubePersonel}
          yil={yil}
          ay={ay}
          adSoyad={adSoyad}
          donem={donem}
        />
      )}
    </>
  );
};

export default BordroRaporModal;
