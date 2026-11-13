"use client";

import type { ReactNode } from "react";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { HAFTA_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import type { MesaiCizelgesiSelectResponseType } from "@/modules/bordro/types/puantaj";
import { getHaftaBilgisi } from "../puantaj-helpers";
import { MESAI_TOPLAM_ALANLARI, mesaiParcalari } from "./mesai-helpers";

type Props = {
  kayit: MesaiCizelgesiSelectResponseType | null;
  onOpenChange: (open: boolean) => void;
};

function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const str = String(value).trim();
  return str === "" || str === "0" ? "-" : str;
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground wrap-break-word">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Puantaj drawer'ındaki gibi ayın tamamı; mesai değeri hücrede alt alta. */
function AyTakvimi({ kayit }: { kayit: MesaiCizelgesiSelectResponseType }) {
  const yil = Number(kayit.Yil);
  const ay = Number(kayit.Ay);
  const gunSayisi = yil && ay ? new Date(yil, ay, 0).getDate() : 31;
  const bosHucre = getHaftaBilgisi(yil, ay, 1).haftaNo - 1;

  return (
    <div className="grid grid-cols-7 gap-1">
      {HAFTA_DATA.map((h) => (
        <div
          key={h.value}
          className={cn(
            "pb-1 text-center text-[10px] font-semibold",
            h.isWeekend ? "text-red-500" : "text-muted-foreground",
          )}
        >
          {h.shortTr}
        </div>
      ))}
      {Array.from({ length: bosHucre }, (_, i) => (
        <div key={`bos-${i}`} />
      ))}
      {Array.from({ length: gunSayisi }, (_, i) => {
        const gunNo = i + 1;
        const parcalar = mesaiParcalari(
          kayit[`G${gunNo}` as keyof MesaiCizelgesiSelectResponseType] as
            | string
            | null,
        );
        const { isWeekend } = getHaftaBilgisi(yil, ay, gunNo);
        return (
          <div
            key={gunNo}
            className={cn(
              "flex aspect-square min-w-0 flex-col items-center justify-between rounded-md border border-border/70 p-1",
              parcalar.length > 0
                ? "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20"
                : isWeekend
                  ? "bg-red-50/50 dark:bg-red-950/20"
                  : "bg-background",
            )}
            title={parcalar.join(" ")}
          >
            <span
              className={cn(
                "self-start text-[10px] leading-none font-medium",
                isWeekend ? "text-red-500" : "text-muted-foreground",
              )}
            >
              {gunNo}
            </span>
            {parcalar.length > 0 ? (
              <span className="flex max-w-full flex-col items-center text-[10px] leading-tight font-semibold text-amber-700 tabular-nums dark:text-amber-400">
                {parcalar.map((p, idx) => (
                  <span key={idx} className="max-w-full truncate">
                    {p}
                  </span>
                ))}
              </span>
            ) : (
              <span />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MesaiDrawer({ kayit: seciliKayit, onOpenChange }: Props) {
  const kayit = useLastDefined(seciliKayit);
  if (!kayit) return null;

  return (
    <SideDrawer
      open={!!seciliKayit}
      onOpenChange={onOpenChange}
      title={kayit.AdSoyad}
      badge={
        kayit.CikisTarihi2 ? (
          <Badge variant="danger">Çıkış yapmış</Badge>
        ) : undefined
      }
      description={[
        kayit.TcKimlikNo && `TC: ${kayit.TcKimlikNo}`,
        kayit.BolumAdi,
        `${kayit.Ay}/${kayit.Yil}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      bodyClassName="space-y-5"
      size="md"
    >
      <Section title="Personel">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-3 sm:grid-cols-3">
          <InfoItem label="Sicil No" value={dash(kayit.SicilNo)} />
          <InfoItem label="T.C. Kimlik No" value={dash(kayit.TcKimlikNo)} />
          <InfoItem label="Bölüm" value={dash(kayit.BolumAdi)} />
          <InfoItem label="Ünvan" value={dash(kayit.UnvanAdi2)} />
          <InfoItem label="İşe Giriş" value={dash(kayit.IseSonGirisTarihi2)} />
          <InfoItem label="Çıkış" value={dash(kayit.CikisTarihi2)} />
          <InfoItem label="Ödeme Şekli" value={dash(kayit.OdemeSekli)} />
          <InfoItem label="Sendika" value={dash(kayit.SendikaDurumu2)} />
        </div>
      </Section>

      <Section title="Mesai Toplamları">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MESAI_TOPLAM_ALANLARI.map(({ key, title }) => {
            const value = kayit[key] as string | null;
            const bos = !value || Number(value) === 0;
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"
              >
                <dt className="min-w-0 text-xs text-muted-foreground">
                  {title}
                </dt>
                <dd
                  className={cn(
                    "text-base/tight font-semibold tabular-nums",
                    bos ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {bos ? 0 : value}
                </dd>
              </div>
            );
          })}
        </dl>
      </Section>

      <Section title="Günlük Mesai">
        <AyTakvimi kayit={kayit} />
      </Section>
    </SideDrawer>
  );
}
