"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Ban,
  Download,
  Eye,
  FileText,
  HandCoins,
  Loader2,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { downloadBlob } from "@/components/export/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCrmSatisTahsilatlari, useCrmTahsilatlar } from "@/modules/crm/hooks/use-finans";
import { useCrmSatisDetay } from "@/modules/crm/hooks/use-satis";
import { KISI_TIP_ETIKET } from "@/modules/crm/lib/kisiler";
import { ODEME_DURUM, ODEME_SEKLI_ETIKET, TAHSILAT_TIP, satisOdemeOzeti } from "@/modules/crm/lib/finans";
import {
  DONEM_DURUM,
  SATIS_DURUM,
  SATIS_TIPI_ETIKET,
  abonelikMi,
  satisIzin,
  satisPdfDosyaAdi,
  yenilemeMetni,
} from "@/modules/crm/lib/satis";
import { gunFormat, kdvDagilimiHesapla, paraFormat } from "@/modules/crm/lib/teklif";
import type { CrmSatisDetay, DbId } from "@/modules/crm/types/satis";

import { TahsilatFormDialog, type TahsilatFormModu } from "../finans/TahsilatFormDialog";
import { KalemOzetTablosu } from "../teklifler/KalemOzetTablosu";
import { belgePdfOlustur, pdfYazdir } from "../teklifler/TeklifPdfOnizleme";
import { TeklifToplamPaneli } from "../teklifler/TeklifToplamPaneli";
import type { SatisIslemTipi } from "./SatisIslemDialog";
import { SatisPdfDialog, useSatisPdfVerisi } from "./SatisPdfDialog";

type Props = {
  IDCrmSatis: DbId | null;
  onOpenChange: (open: boolean) => void;
  onDuzenle: (s: CrmSatisDetay) => void;
  /** tahsilEdilen: iptalde iade önerisi için. */
  onIslem: (tip: SatisIslemTipi, s: CrmSatisDetay, tahsilEdilen: number) => void;
  /** Önceki / sonraki döneme geçiş. */
  onSec: (IDCrmSatis: DbId) => void;
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

function Tutar({ label, deger, className }: { label: string; deger: string; className?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-semibold tabular-nums", className)}>{deger}</p>
    </div>
  );
}

/**
 * Satış detayı: bilgiler, dönem, kalemler, toplamlar ve ödeme özeti.
 * Ödeme bilgisi finans sorgularından okunur; satış kaydı para tutmaz.
 */
export function SatisDrawer({ IDCrmSatis, onOpenChange, onDuzenle, onIslem, onSec }: Props) {
  const [tahsilatMod, setTahsilatMod] = useState<TahsilatFormModu | null>(null);
  const [pdfIslem, setPdfIslem] = useState<"indir" | "yazdir" | null>(null);
  const [pdfOnizle, setPdfOnizle] = useState(false);
  // Kapanış animasyonunda son açılan satış gösterilmeye devam eder.
  const seciliID = useLastDefined(IDCrmSatis);
  const { data: canli, isLoading, isError, refetch } = useCrmSatisDetay(seciliID);
  const son = useLastDefined(canli ?? null);
  // Başka döneme geçerken yeni veri gelene kadar eski satışın butonları görünmesin.
  const s = son && String(son.IDCrmSatis) === String(seciliID) ? son : null;

  const { data: tahsilatHaritasi } = useCrmSatisTahsilatlari(seciliID != null);
  const { data: tahsilatlar = [] } = useCrmTahsilatlar({ IDCrmSatis: seciliID }, seciliID != null);
  const pdfVeri = useSatisPdfVerisi(s);

  if (!seciliID) return null;

  const odeme = s ? satisOdemeOzeti(s, tahsilatHaritasi?.get(String(s.IDCrmSatis))) : null;
  const tahsilatVar = !!odeme && (odeme.TahsilEdilen !== 0 || tahsilatlar.length > 0);
  const durum = s ? SATIS_DURUM[s.Durum] : null;
  const donem = s?.DonemDurumu != null && s.DonemDurumu !== 0 ? DONEM_DURUM[s.DonemDurumu] : null;
  const kdvDagilimi = s ? kdvDagilimiHesapla(s.Kalemler, s) : [];

  /** Önizlemeden geçmeden doğrudan indir / yazdır. */
  const pdfAl = async (islem: "indir" | "yazdir") => {
    if (!s || !pdfVeri) return;
    setPdfIslem(islem);
    try {
      const blob = await belgePdfOlustur(pdfVeri);
      if (islem === "indir") downloadBlob(blob, satisPdfDosyaAdi(s.SatisNo));
      else pdfYazdir(blob);
    } catch (error) {
      toast.error((error as Error)?.message || "PDF oluşturulamadı.");
    } finally {
      setPdfIslem(null);
    }
  };

  const footer = s && (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        {satisIzin.sil(s, tahsilatVar) && (
          <Button variant="danger" appearance="ghost" onClick={() => onIslem("sil", s, odeme?.TahsilEdilen ?? 0)}>
            <Trash2 /> Sil
          </Button>
        )}
        {satisIzin.iptal(s) && (
          <Button variant="warning" appearance="ghost" onClick={() => onIslem("iptal", s, odeme?.TahsilEdilen ?? 0)}>
            <Ban /> İptal Et
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {satisIzin.yenile(s) && (
          <Button appearance="outline" onClick={() => onIslem("yenile", s, odeme?.TahsilEdilen ?? 0)}>
            <RefreshCw /> Yenile
          </Button>
        )}
        {satisIzin.duzenle(s) && (
          <Button onClick={() => onDuzenle(s)}>
            <Pencil /> Düzenle
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <SideDrawer
        open={IDCrmSatis != null}
        onOpenChange={onOpenChange}
        size="lg"
        title={s ? s.SatisNo : "Satış"}
        badge={
          durum && (
            <span className="flex gap-1.5">
              <Badge variant={durum.variant}>{durum.label}</Badge>
              {odeme?.OdemeDurumu != null && (
                <Badge variant={ODEME_DURUM[odeme.OdemeDurumu].variant}>{ODEME_DURUM[odeme.OdemeDurumu].label}</Badge>
              )}
            </span>
          )
        }
        description={s?.Konu}
        icon={
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HandCoins className="size-6" />
          </div>
        }
        bodyClassName="space-y-6"
        footer={footer}
      >
        {!s ? (
          isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-destructive">
              {isError ? "Satış getirilemedi. " : "Satış bulunamadı. "}
              <button type="button" className="underline" onClick={() => refetch()}>
                Tekrar dene
              </button>
            </div>
          )
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Bilgi label="Kişi">
                {s.KisiAdi ?? "-"}
                <span className="text-muted-foreground"> · {KISI_TIP_ETIKET[s.KisiTip]}</span>
              </Bilgi>
              <Bilgi label="Satışı Yapan">{s.Ad ?? s.KullaniciAdi}</Bilgi>
              <Bilgi label="Satış Tarihi">{gunFormat(s.SatisTarihi)}</Bilgi>
              <Bilgi label="Satış Tipi">{SATIS_TIPI_ETIKET[s.SatisTipi]}</Bilgi>
              {abonelikMi(s.SatisTipi) && (
                <Bilgi label="Dönem">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {gunFormat(s.BaslangicTarihi)} – {gunFormat(s.BitisTarihi)}
                    {donem && <Badge variant={donem.variant}>{donem.label}</Badge>}
                  </span>
                  {s.Durum === 0 && !s.YenilendiMi && (
                    <span
                      className={cn(
                        "text-xs",
                        (s.YenilemeGunKalan ?? 99) <= 30 ? "font-medium text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {yenilemeMetni(s.YenilemeGunKalan)}
                    </span>
                  )}
                </Bilgi>
              )}
              <Bilgi label="Para Birimi">
                {s.ParaBirimi}
                {s.ParaBirimi !== "TRY" && (
                  <span className="text-muted-foreground">
                    {" "}
                    · kur {s.Kur.toLocaleString("tr-TR", { maximumFractionDigits: 6 })}
                  </span>
                )}
              </Bilgi>
              <Bilgi label="Kaynak Teklif">
                {s.IDCrmTeklif != null && (
                  <Link href={`/crm/teklifler?teklif=${s.IDCrmTeklif}`} className="text-primary underline">
                    {s.TeklifNoTam ?? "Teklif"}
                  </Link>
                )}
              </Bilgi>
              <Bilgi label="Önceki Dönem">
                {s.IDCrmSatisOnceki != null && (
                  <button type="button" className="text-primary underline" onClick={() => onSec(s.IDCrmSatisOnceki!)}>
                    {s.OncekiSatisNo ?? "Önceki satış"}
                  </button>
                )}
              </Bilgi>
              <Bilgi label="Sonraki Dönem">
                {s.IDCrmSatisSonraki != null && (
                  <button type="button" className="text-primary underline" onClick={() => onSec(s.IDCrmSatisSonraki!)}>
                    {s.SonrakiSatisNo ?? "Sonraki satış"}
                  </button>
                )}
              </Bilgi>
              <Bilgi label="İptal Tarihi">{s.IptalTarihi && formatDate(s.IptalTarihi, "dd.MM.yyyy HH:mm")}</Bilgi>
              {s.IptalNedeni && (
                <div className="sm:col-span-2">
                  <Bilgi label="İptal Nedeni">{s.IptalNedeni}</Bilgi>
                </div>
              )}
            </dl>

            {/* PDF */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <FileText className="size-4 text-muted-foreground" />
                Satış Belgesi (PDF)
              </span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" appearance="outline" onClick={() => setPdfOnizle(true)}>
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

            {/* Ödeme özeti (finans) */}
            {odeme && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Ödeme</h3>
                  {/* Tahsilat finans kaydıdır; burada kısayol olarak açılır. İptalde sadece iade. */}
                  {(s.Durum === 0 && odeme.Kalan > 0) || odeme.TahsilEdilen > 0 ? (
                    <Button
                      size="sm"
                      appearance="outline"
                      onClick={() =>
                        setTahsilatMod({
                          tip: "yeni",
                          Tip: s.Durum === 0 && odeme.Kalan > 0 ? 1 : 2,
                          satis: {
                            IDCrmSatis: s.IDCrmSatis,
                            SatisNo: s.SatisNo,
                            KisiAdi: s.KisiAdi,
                            ParaBirimi: s.ParaBirimi,
                            Kalan: odeme.Kalan,
                            TahsilEdilen: odeme.TahsilEdilen,
                          },
                        })
                      }
                    >
                      <Plus /> {s.Durum === 0 && odeme.Kalan > 0 ? "Tahsilat Ekle" : "İade Ekle"}
                    </Button>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Tutar label="Satış Toplamı" deger={paraFormat(s.GenelToplam, s.ParaBirimi)} />
                  <Tutar label="Tahsil Edilen" deger={paraFormat(odeme.TahsilEdilen, s.ParaBirimi)} />
                  <Tutar
                    label={odeme.Kalan < 0 ? "Fazla / İade Edilecek" : "Kalan"}
                    deger={paraFormat(Math.abs(odeme.Kalan), s.ParaBirimi)}
                    className={cn(odeme.Kalan > 0 && "text-destructive")}
                  />
                </div>
                {tahsilatlar.length > 0 && (
                  <ul className="divide-y rounded-md border bg-background text-sm">
                    {tahsilatlar.map((t) => (
                      <li key={String(t.IDCrmTahsilat)}>
                        <button
                          type="button"
                          onClick={() => setTahsilatMod({ tip: "duzenle", IDCrmTahsilat: t.IDCrmTahsilat })}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/30"
                        >
                          <span className="min-w-0">
                            <span className="font-medium">{gunFormat(t.Tarih)}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              · {ODEME_SEKLI_ETIKET[t.OdemeSekli]}
                              {t.FaturaNo && ` · ${t.FaturaNo}`}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className={cn("tabular-nums", t.Tip === 2 && "text-destructive")}>
                              {paraFormat(t.IsaretliTutar, t.ParaBirimi)}
                            </span>
                            <Badge variant={TAHSILAT_TIP[t.Tip].variant}>{TAHSILAT_TIP[t.Tip].label}</Badge>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Kalemler</h3>
              <KalemOzetTablosu
                kalemler={s.Kalemler.map((k) => ({ ...k, key: String(k.IDCrmSatisKalem) }))}
                paraBirimi={s.ParaBirimi}
              />
            </div>

            <TeklifToplamPaneli {...s} kdvDagilimi={kdvDagilimi} />

            {s.Aciklama && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Açıklama</h3>
                <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap wrap-break-word">{s.Aciklama}</p>
              </div>
            )}
          </>
        )}
      </SideDrawer>

      <TahsilatFormDialog mod={tahsilatMod} onOpenChange={(v) => !v && setTahsilatMod(null)} />
      <SatisPdfDialog IDCrmSatis={pdfOnizle && s ? s.IDCrmSatis : null} onOpenChange={(v) => !v && setPdfOnizle(false)} />
    </>
  );
}
