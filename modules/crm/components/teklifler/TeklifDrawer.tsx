"use client";

import { useState, type ReactNode } from "react";
import {
  Ban,
  CircleCheck,
  CircleX,
  CopyPlus,
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Printer,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTeklifDetay, useTeklifRevizyonlari } from "@/modules/crm/hooks/use-teklif";
import { KISI_TIP_ETIKET } from "@/modules/crm/lib/kisiler";
import { downloadBlob } from "@/components/export/types";
import {
  paraFormat,
  teklifDurumGorunum,
  teklifHesapla,
  teklifIzin,
  teklifPdfDosyaAdi,
  teklifPdfVerisiDetaydan,
} from "@/modules/crm/lib/teklif";
import type { DbId, TeklifDetay } from "@/modules/crm/types/teklif";

import type { TeklifIslemTipi } from "./TeklifIslemDialog";
import { pdfYazdir, teklifPdfOlustur } from "./TeklifPdfOnizleme";
import { TeklifToplamPaneli } from "./TeklifToplamPaneli";

type Props = {
  IDCrmTeklif: DbId | null;
  onOpenChange: (open: boolean) => void;
  onDuzenle: (t: TeklifDetay) => void;
  onIslem: (tip: TeklifIslemTipi, t: TeklifDetay) => void;
  /** Revizyon geçmişinden başka bir sürüme geçiş. */
  onSec: (IDCrmTeklif: DbId) => void;
  /** PDF önizleme dialog'unu açar. */
  onPdf: (t: TeklifDetay) => void;
};

function Bilgi({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === "" || children === false) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

const miktarFormat = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 3 });

/** Teklif detayı: bilgiler, kalemler, toplamlar, revizyon geçmişi ve durum işlemleri. */
export function TeklifDrawer({ IDCrmTeklif, onOpenChange, onDuzenle, onIslem, onSec, onPdf }: Props) {
  const [pdfIslem, setPdfIslem] = useState<"indir" | "yazdir" | null>(null);
  // Kapanış animasyonunda son açılan teklif gösterilmeye devam eder.
  const seciliID = useLastDefined(IDCrmTeklif);
  const { data: canli, isLoading, isError, refetch } = useTeklifDetay(seciliID);
  const son = useLastDefined(canli ?? null);
  // Başka sürüme geçerken yeni veri gelene kadar eski teklifin butonları görünmesin.
  const t = son && String(son.IDCrmTeklif) === String(seciliID) ? son : null;
  const { data: surumler = [] } = useTeklifRevizyonlari(t && t.RevizyonSayisi > 1 ? t.TeklifNo : null);

  if (!seciliID) return null;

  const durum = t ? teklifDurumGorunum(t) : null;
  // KDV dağılımı kayıtlı kalemlerden (toplamlar DB'deki değerler).
  const kdvDagilimi = t ? teklifHesapla(t.Kalemler, t.GenelIskontoOrani).kdvDagilimi : [];

  /** Önizlemeden geçmeden doğrudan indir / yazdır. */
  const pdfAl = async (islem: "indir" | "yazdir") => {
    if (!t) return;
    setPdfIslem(islem);
    try {
      const blob = await teklifPdfOlustur(teklifPdfVerisiDetaydan(t));
      if (islem === "indir") downloadBlob(blob, teklifPdfDosyaAdi(t.TeklifNoTam));
      else pdfYazdir(blob);
    } catch (error) {
      toast.error((error as Error)?.message || "PDF oluşturulamadı.");
    } finally {
      setPdfIslem(null);
    }
  };

  const footer = t && (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        {teklifIzin.sil(t.Durum) && (
          <Button variant="danger" appearance="ghost" onClick={() => onIslem("sil", t)}>
            <Trash2 /> Sil
          </Button>
        )}
        {teklifIzin.iptal(t.Durum) && (
          <Button variant="warning" appearance="ghost" onClick={() => onIslem("iptal", t)}>
            <Ban /> İptal Et
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {teklifIzin.iptalGeriAl(t.Durum) && (
          <Button appearance="outline" onClick={() => onIslem("iptalGeriAl", t)}>
            <RotateCcw /> İptali Geri Al
          </Button>
        )}
        {teklifIzin.revize(t.Durum) && (
          <Button appearance="outline" onClick={() => onIslem("revize", t)}>
            <CopyPlus /> Revize Et
          </Button>
        )}
        {teklifIzin.red(t.Durum) && (
          <Button variant="danger" appearance="outline" onClick={() => onIslem("red", t)}>
            <CircleX /> Reddedildi
          </Button>
        )}
        {teklifIzin.kabul(t.Durum) && (
          <Button variant="success" onClick={() => onIslem("kabul", t)}>
            <CircleCheck /> Kabul Edildi
          </Button>
        )}
        {teklifIzin.duzenle(t.Durum) && (
          <Button appearance="outline" onClick={() => onDuzenle(t)}>
            <Pencil /> Düzenle
          </Button>
        )}
        {teklifIzin.gonder(t.Durum) && (
          <Button onClick={() => onIslem("gonder", t)}>
            <Send /> Gönderildi İşaretle
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <SideDrawer
      open={IDCrmTeklif != null}
      onOpenChange={onOpenChange}
      size="lg"
      title={t ? t.TeklifNoTam : "Teklif"}
      badge={durum && <Badge variant={durum.variant}>{durum.label}</Badge>}
      description={t?.Konu}
      icon={
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-6" />
        </div>
      }
      bodyClassName="space-y-6"
      footer={footer}
    >
      {!t ? (
        isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-destructive">
            {isError ? "Teklif getirilemedi. " : "Teklif bulunamadı. "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Tekrar dene
            </button>
          </div>
        )
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Bilgi label="Kişi">
              {t.KisiAdi ?? "-"}
              <span className="text-muted-foreground"> · {KISI_TIP_ETIKET[t.KisiTip]}</span>
            </Bilgi>
            <Bilgi label="Hazırlayan">{t.Ad ?? t.KullaniciAdi}</Bilgi>
            <Bilgi label="Teklif Tarihi">{formatDate(t.TeklifTarihi)}</Bilgi>
            <Bilgi label="Geçerlilik">
              {t.GecerlilikTarihi && (
                <span className={cn(t.SuresiDoldu && "font-medium text-destructive")}>
                  {formatDate(t.GecerlilikTarihi)}
                  {t.SuresiDoldu && " · süresi doldu"}
                </span>
              )}
            </Bilgi>
            <Bilgi label="Para Birimi">
              {t.ParaBirimi}
              {t.ParaBirimi !== "TRY" && (
                <span className="text-muted-foreground">
                  {" "}
                  · kur {t.Kur.toLocaleString("tr-TR", { maximumFractionDigits: 6 })}
                </span>
              )}
            </Bilgi>
            <Bilgi label="Gönderim">{t.GonderimTarihi && formatDate(t.GonderimTarihi, "dd.MM.yyyy HH:mm")}</Bilgi>
            <Bilgi label={t.Durum === 3 ? "Red Tarihi" : "Yanıt Tarihi"}>
              {t.YanitTarihi && formatDate(t.YanitTarihi, "dd.MM.yyyy HH:mm")}
            </Bilgi>
            {t.RedNedeni && (
              <div className="sm:col-span-2">
                <Bilgi label="Red Nedeni">{t.RedNedeni}</Bilgi>
              </div>
            )}
          </dl>

          {/* PDF */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 text-muted-foreground" />
              Teklif Belgesi (PDF)
            </span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" appearance="outline" onClick={() => onPdf(t)}>
                <Eye /> Önizle
              </Button>
              <Button size="sm" appearance="outline" disabled={!!pdfIslem} onClick={() => pdfAl("yazdir")}>
                {pdfIslem === "yazdir" ? <Loader2 className="animate-spin" /> : <Printer />} Yazdır
              </Button>
              <Button size="sm" disabled={!!pdfIslem} onClick={() => pdfAl("indir")}>
                {pdfIslem === "indir" ? <Loader2 className="animate-spin" /> : <Download />} İndir
              </Button>
            </div>
          </div>

          {/* Kalemler */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Kalemler</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-130 text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Kalem</th>
                    <th className="px-2 py-2 text-right font-medium">Miktar</th>
                    <th className="px-2 py-2 text-right font-medium">Birim Fiyat</th>
                    <th className="px-2 py-2 text-right font-medium">KDV</th>
                    <th className="px-2 py-2 text-right font-medium">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {t.Kalemler.map((k) => (
                    <tr key={String(k.IDCrmTeklifKalem)} className="align-top">
                      <td className="px-2 py-2">
                        <p className="font-medium wrap-break-word">{k.Aciklama}</p>
                        {k.Detay && <p className="text-xs whitespace-pre-wrap text-muted-foreground">{k.Detay}</p>}
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                        {miktarFormat(k.Miktar)} {k.Birim}
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                        {paraFormat(k.BirimFiyat, t.ParaBirimi)}
                        {k.IskontoOrani > 0 && (
                          <p className="text-xs text-muted-foreground">isk. %{k.IskontoOrani}</p>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">%{k.KdvOrani}</td>
                      <td className="px-2 py-2 text-right font-medium whitespace-nowrap tabular-nums">
                        {paraFormat(k.ToplamTutar, t.ParaBirimi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <TeklifToplamPaneli {...t} kdvDagilimi={kdvDagilimi} />

          {t.Aciklama && (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Açıklama</h3>
              <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap wrap-break-word">{t.Aciklama}</p>
            </div>
          )}
          {t.Kosullar && (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Koşullar</h3>
              <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap wrap-break-word">{t.Kosullar}</p>
            </div>
          )}

          {/* Revizyon geçmişi */}
          {surumler.length > 1 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Sürümler</h3>
              <ul className="divide-y rounded-lg border">
                {surumler.map((s) => {
                  const d = teklifDurumGorunum(s);
                  const aktif = String(s.IDCrmTeklif) === String(t.IDCrmTeklif);
                  return (
                    <li key={String(s.IDCrmTeklif)}>
                      <button
                        type="button"
                        disabled={aktif}
                        onClick={() => onSec(s.IDCrmTeklif)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                          aktif ? "bg-muted/50" : "hover:bg-muted/30",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{s.TeklifNoTam}</span>
                          <span className="text-muted-foreground"> · {formatDate(s.TeklifTarihi)}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="tabular-nums">{paraFormat(s.GenelToplam, s.ParaBirimi)}</span>
                          <Badge variant={d.variant}>{d.label}</Badge>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </SideDrawer>
  );
}
