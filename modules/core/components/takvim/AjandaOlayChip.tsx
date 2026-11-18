"use client";

import type { CSSProperties, MouseEvent } from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Bell, MapPin, Repeat, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AjandaOlay } from "@/modules/core/types/takvim";

import { AJANDA_VARSAYILAN_RENK } from "./takvim-utils";

const renkStili = (o: AjandaOlay): CSSProperties => {
  const renk = o.renk ?? AJANDA_VARSAYILAN_RENK;
  return {
    // Arka plan rengin şeffaf hali, sol çizgi rengin kendisi — açık/koyu
    // temada aynı hex okunur kalır.
    backgroundColor: `${renk}1F`,
    borderLeftColor: renk,
  };
};

/** "14:00" / "14:00 – 15:30" / "Tüm gün" */
export function olaySaati(o: AjandaOlay, gun?: Date) {
  if (o.tumGun) return "Tüm gün";
  const bas = format(o.baslangic, "HH:mm");
  if (!o.bitis) return bas;
  // Çok günlük olayda başka bir güne denk gelen parçada başlangıç saati yanıltır.
  if (gun && !isSameDay(gun, o.baslangic)) return `→ ${format(o.bitis, "HH:mm")}`;
  const son = isSameDay(o.baslangic, o.bitis)
    ? format(o.bitis, "HH:mm")
    : format(o.bitis, "d MMM HH:mm", { locale: tr });
  return `${bas} – ${son}`;
}

type Props = {
  olay: AjandaOlay;
  /** Hangi günün hücresinde gösterildiği (çok günlük olaylarda saat metni için). */
  gun?: Date;
  /** compact: ay grid'indeki tek satırlık çip. */
  compact?: boolean;
  onClick?: (olay: AjandaOlay) => void;
};

export function AjandaOlayChip({ olay, gun, compact, onClick }: Props) {
  const bekliyor = !olay.sahip && olay.durum === 0;

  const handleClick = (e: MouseEvent) => {
    // Gün hücresinin seçme davranışını tetiklemesin.
    e.stopPropagation();
    onClick?.(olay);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`${olay.baslik} · ${olaySaati(olay, gun)}`}
        style={renkStili(olay)}
        className={cn(
          "flex w-full items-center gap-1.5 truncate rounded-md border-l-4 px-2 py-1 text-left text-xs leading-tight font-medium text-foreground hover:brightness-95 dark:hover:brightness-125",
          bekliyor && "border-dashed italic opacity-80",
        )}
      >
        {!olay.tumGun && (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {format(olay.baslangic, "HH:mm")}
          </span>
        )}
        <span className="truncate">{olay.baslik}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={renkStili(olay)}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-md border-l-4 px-2.5 py-2 text-left text-xs text-foreground hover:brightness-95 dark:hover:brightness-125",
        bekliyor && "border-dashed italic opacity-80",
      )}
    >
      <span className="font-medium">{olay.baslik}</span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground">
        <span className="tabular-nums">{olaySaati(olay, gun)}</span>
        {olay.konum && (
          <span className="inline-flex min-w-0 items-center gap-0.5">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{olay.konum}</span>
          </span>
        )}
        {olay.tekrarli && <Repeat className="size-3" aria-label="Tekrarlı" />}
        {olay.katilimciSayisi > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <Users className="size-3" />
            {olay.katilimciSayisi}
          </span>
        )}
        {olay.hatirlatmaDakika != null && <Bell className="size-3" aria-label="Hatırlatma var" />}
      </span>
    </button>
  );
}
