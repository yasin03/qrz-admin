"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Info,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { usePuantajList } from "@/hooks/use-puantaj";
import { getPuantajBadge, getHaftaBilgisi } from "./puantaj-helpers";
import { AY_DATA } from "@/constants/data";
import { cn } from "@/lib/utils";
import type { PuantajSelectRequestType } from "@/types/puantaj";

type Props = {
  baseParams: Pick<PuantajSelectRequestType, "IDSube" | "IDBolum">;
  // savedContext alanları null da dönebildiği için tip burada genişletildi
  initialYil?: string | null;
  initialAy?: string | null;
};

function useYilSecenekleri() {
  const now = new Date().getFullYear();
  return useMemo(
    () => Array.from({ length: 4 }, (_, i) => (now - 2 + i).toString()),
    [now],
  );
}

export default function PersonelPuantajTakvimi({
  baseParams,
  initialYil,
  initialAy,
}: Props) {
  const [yil, setYil] = useState(
    initialYil || new Date().getFullYear().toString(),
  );
  const [ay, setAy] = useState(
    initialAy || (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );

  const yilSecenekleri = useYilSecenekleri();

  const { data, isLoading } = usePuantajList(
    {
      ...baseParams,
      Yil: yil,
      Ay: ay,
      Adi: "",
      TcKimlikNo: "",
    },
    true,
  );

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

  const ozetKalemleri = kayit
    ? [
        { label: "Toplam Gün", value: kayit.ToplamGun, icon: CalendarDays },
        { label: "Toplam Saat", value: kayit.ToplamSaat, icon: Clock },
        { label: "Yıllık İzin", value: kayit.ToplamYI },
        { label: "Mazeret İzni", value: kayit.ToplamMI },
        { label: "Evlilik İzni", value: kayit.ToplamEI },
        { label: "Rapor", value: kayit.ToplamRP },
      ].filter((item) => item.value !== null && item.value !== undefined)
    : [];

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

      {ozetKalemleri.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ozetKalemleri.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-card/60 p-3 text-center"
            >
              <div className="text-xl font-semibold text-foreground">
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
                  <span className="mt-1 text-xs text-muted-foreground">
                    {gun.shortDay}
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
        )}
      </div>
    </div>
  );
}
