"use client";

import { useMemo, useState } from "react";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePuantajById } from "@/hooks/use-puantaj";
import { AY_DATA, HAFTA_DATA, useYearOptions } from "@/constants/data";
import { cn } from "@/lib/utils";
import { useUser } from "@/stores/auth-store";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarCheck,
  CalendarDays,
  Clock,
  Coffee,
  CircleDashed,
  Flag,
  Plane,
  CalendarClock,
  Hourglass,
  type LucideIcon,
} from "lucide-react";
import {
  getPuantajBadge,
  getHaftaBilgisi,
  PUANTAJ_KOD_ACIKLAMALARI,
} from "./puantaj-helpers";

import type {
  PuantajSelectRequestType,
  PuantajSelectResponseType,
} from "@/types/puantaj";

type Props = {
  initialYil?: string | null;
  initialAy?: string | null;
};

type OzetAlani = {
  key: keyof PuantajSelectResponseType;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

const OZET_ALANLARI: OzetAlani[] = [
  {
    key: "ToplamGun",
    label: "Çalışılan Gün",
    icon: CalendarCheck,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "ToplamSaat",
    label: "Çalışılan Saat",
    icon: Clock,
    iconClassName: "bg-sky-50 text-sky-600",
  },
  {
    key: "ToplamHT",
    label: "Hafta Tatili",
    icon: Coffee,
    iconClassName: "bg-red-50 text-red-600",
  },
  {
    key: "Bos",
    label: "Boş Gün",
    icon: CircleDashed,
    iconClassName: "bg-gray-100 text-gray-500",
  },
  {
    key: "ToplamGT",
    label: "Genel Tatil",
    icon: Flag,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  {
    key: "ToplamYI",
    label: "Yıllık İzin",
    icon: Plane,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    key: "ToplamMI",
    label: "Mazeret İzni",
    icon: CalendarClock,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
  {
    key: "ToplamFM",
    label: "Fazla Mesai",
    icon: Hourglass,
    iconClassName: "bg-amber-50 text-amber-600",
  },
];

export default function PersonelPuantajTakvimi({
  initialYil,
  initialAy,
}: Props) {
  const user = useUser();
  const [yil, setYil] = useState(
    initialYil || new Date().getFullYear().toString(),
  );
  const [ay, setAy] = useState(
    initialAy || (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );

  const yilSecenekleri = useYearOptions(5,1);

  const { data, isLoading } = usePuantajById({
    IDSubePersonel: user?.IDSubePersonel ?? "0",
    Yil: yil,
    Ay: ay,
  });

  const kayit = data?.[0];

  const gunSayisi = useMemo(() => {
    const y = Number(yil);
    const a = Number(ay);
    if (!y || !a) return 30;
    return new Date(y, a, 0).getDate();
  }, [yil, ay]);

  const bosHucreSayisi = useMemo(() => {
    const { haftaNo } = getHaftaBilgisi(Number(yil), Number(ay), 1);
    return haftaNo - 1;
  }, [yil, ay]);

  const gunler = useMemo(() => {
    return Array.from({ length: gunSayisi }, (_, i) => {
      const gunNo = i + 1;
      const key = `G${gunNo}` as keyof NonNullable<typeof kayit>;
      const value = kayit ? (kayit[key] as string | null) : null;
      const { isWeekend, shortDay } = getHaftaBilgisi(
        Number(yil),
        Number(ay),
        gunNo,
      );
      return {
        gunNo,
        value,
        isWeekend,
        shortDay,
        badge: getPuantajBadge(value),
      };
    });
  }, [gunSayisi, kayit, yil, ay]);

  const handlePrevMonth = () => {
    const a = Number(ay);
    if (a === 1) {
      setAy("12");
      setYil((y) => (Number(y) - 1).toString());
    } else {
      setAy((a - 1).toString().padStart(2, "0"));
    }
  };

  const handleNextMonth = () => {
    const a = Number(ay);
    if (a === 12) {
      setAy("01");
      setYil((y) => (Number(y) + 1).toString());
    } else {
      setAy((a + 1).toString().padStart(2, "0"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
        <div>
          <div className="text-lg font-semibold text-foreground">
            {kayit?.AdSoyad || "—"}
          </div>
          <div className="text-sm text-muted-foreground">
            {kayit?.TcKimlikNo ? `TC: ${kayit.TcKimlikNo}` : ""}
            {kayit?.BolumAdi ? ` · ${kayit.BolumAdi}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            appearance="outline"
            color="secondary"
            onClick={handlePrevMonth}
            aria-label="Önceki ay"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Select value={ay} onValueChange={setAy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Ay" />
            </SelectTrigger>
            <SelectContent>
              {AY_DATA.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yil} onValueChange={setYil}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Yıl" />
            </SelectTrigger>
            <SelectContent>
              {yilSecenekleri.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="icon-sm"
            appearance="outline"
            color="secondary"
            onClick={handleNextMonth}
            aria-label="Sonraki ay"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {kayit && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {OZET_ALANLARI.map(({ key, label, icon: Icon, iconClassName }) => {
            const value = kayit[key] as number | string | null | undefined;
            const isEmpty =
              value === null || value === undefined || Number(value) === 0;

            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 transition-shadow hover:shadow-md"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    iconClassName,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-xl leading-tight font-semibold",
                      isEmpty ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {value ?? 0}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/40 p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Yükleniyor...
          </div>
        ) : !kayit ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Info className="size-6" />
            <span>Bu ay için puantaj kaydı bulunamadı.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-208 grid-cols-7 gap-3">
              {HAFTA_DATA.map((haftaGunu) => (
                <div
                  key={haftaGunu.value}
                  className={cn(
                    "px-1 text-center text-xs font-semibold",
                    haftaGunu.isWeekend
                      ? "text-red-500"
                      : "text-muted-foreground",
                  )}
                >
                  {haftaGunu.shortTr}
                </div>
              ))}

              {Array.from({ length: bosHucreSayisi }, (_, i) => (
                <div key={`bos-${i}`} />
              ))}

              {gunler.map((gun) => (
                <div
                  key={gun.gunNo}
                  className={cn(
                    "flex min-h-19 items-center justify-between gap-2 rounded-lg border border-border/70 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
                    gun.isWeekend ? "bg-red-50/40" : "bg-background",
                  )}
                >
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-2xl leading-none font-semibold",
                        gun.isWeekend ? "text-red-500" : "text-foreground",
                      )}
                    >
                      {gun.gunNo}
                    </span>
                  </div>

                  {gun.badge ? (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-md p-2 text-lg",
                        gun.badge.className,
                      )}
                    >
                      {gun.badge.label}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="size-4 text-muted-foreground" />
          Kod Açıklamaları
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {PUANTAJ_KOD_ACIKLAMALARI.map((item) => (
            <div key={item.kod} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex min-w-9 shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold",
                  item.className,
                )}
              >
                {item.kod}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Not: Kodlar, puantaj sisteminde kullanılan izin ve durum kodlarını
          temsil eder.
        </p>
      </div>
    </div>
  );
}
