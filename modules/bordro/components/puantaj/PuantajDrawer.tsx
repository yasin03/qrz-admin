"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Clock3, Info } from "lucide-react";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { HAFTA_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import type { PuantajSelectResponseType } from "@/modules/bordro/types/puantaj";
import { OZET_ALANLARI } from "./PersonelPuantajTakvimi";
import { getHaftaBilgisi, getPuantajBadge } from "./puantaj-helpers";

type Props = {
  kayit: PuantajSelectResponseType | null;
  onOpenChange: (open: boolean) => void;
};

// Özet kartlarında olmayan, sıfırdan farklıysa gösterilen toplamlar
const DIGER_TOPLAMLAR: { key: keyof PuantajSelectResponseType; label: string }[] = [
  { key: "SgkGunSayisi", label: "SGK Gün Sayısı" },
  { key: "SgkEksikGun", label: "SGK Eksik Gün" },
  { key: "ToplamEI", label: "Evlilik İzni" },
  { key: "ToplamDI", label: "Doğum İzni" },
  { key: "ToplamCI", label: "Cenaze İzni" },
  { key: "ToplamYemek", label: "Yemek" },
  { key: "ToplamYol", label: "Yol" },
];

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

function AyTakvimi({ kayit }: { kayit: PuantajSelectResponseType }) {
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
        const value = kayit[`G${gunNo}` as keyof PuantajSelectResponseType] as
          | string
          | null;
        const badge = getPuantajBadge(value);
        const { isWeekend } = getHaftaBilgisi(yil, ay, gunNo);
        return (
          <div
            key={gunNo}
            className={cn(
              "flex aspect-square flex-col items-center justify-between rounded-md border border-border/70 p-1",
              isWeekend ? "bg-red-50/50 dark:bg-red-950/20" : "bg-background",
            )}
          >
            <span
              className={cn(
                "self-start text-[10px] leading-none font-medium",
                isWeekend ? "text-red-500" : "text-muted-foreground",
              )}
            >
              {gunNo}
            </span>
            {badge ? (
              <span
                className={cn(
                  "rounded px-1 text-[11px] leading-tight font-semibold",
                  badge.className,
                )}
              >
                {badge.label}
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

export default function PuantajDrawer({ kayit: seciliKayit, onOpenChange }: Props) {
  const kayit = useLastDefined(seciliKayit);
  if (!kayit) return null;

  const onayli = Boolean(kayit.OnayTarihi);
  const digerToplamlar = DIGER_TOPLAMLAR.filter(
    ({ key }) => Number(kayit[key] ?? 0) !== 0,
  );

  return (
    <SideDrawer
      open={!!seciliKayit}
      onOpenChange={onOpenChange}
      title={kayit.AdSoyad}
      badge={
        <Badge variant={onayli ? "success" : "warning"}>
          {onayli ? (
            <BadgeCheck className="mr-1 inline size-3.5" />
          ) : (
            <Clock3 className="mr-1 inline size-3.5" />
          )}
          {onayli ? "Onaylı" : "Onay bekliyor"}
        </Badge>
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
          <InfoItem label="Ünvan" value={dash(kayit.UnvanAdi2 || kayit.UnvanAdi)} />
          <InfoItem label="İşe Giriş" value={dash(kayit.IseSonGirisTarihi2)} />
          <InfoItem label="Çıkış" value={dash(kayit.CikisTarihi2)} />
          <InfoItem label="Ödeme Şekli" value={dash(kayit.OdemeSekli)} />
          <InfoItem label="Sendika" value={dash(kayit.SendikaDurumu2)} />
        </div>
      </Section>

      <Section title="Ay Özeti">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OZET_ALANLARI.map(({ key, label, icon: Icon, iconClassName }) => {
            const value = kayit[key] as string | number | null;
            const bos = !value || Number(value) === 0;
            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-lg border border-border p-2"
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md",
                    iconClassName,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="min-w-0 flex-1  text-xs text-muted-foreground">
                  {label}
                </span>
                <span
                  className={cn(
                    "text-base/tight font-semibold tabular-nums",
                    bos ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {value ?? 0}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Günlük Puantaj">
        <AyTakvimi kayit={kayit} />
      </Section>

      {digerToplamlar.length > 0 ? (
        <Section title="Diğer Toplamlar">
          <dl className="divide-y rounded-lg border">
            {digerToplamlar.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between px-3 py-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold tabular-nums">{String(kayit[key])}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Hücreleri düzenlemek için tablodaki gün sütunlarını kullanın.
      </p>
    </SideDrawer>
  );
}
