"use client";

import { isSameDay, isSameMonth, isToday } from "date-fns";

import { cn } from "@/lib/utils";
import type { AjandaOlay, TakvimGunu } from "@/modules/core/types/takvim";

import { AjandaOlayChip } from "./AjandaOlayChip";
import { TakvimEtkinlik } from "./TakvimEtkinlik";
import {
  AJANDA_VARSAYILAN_RENK,
  HAFTA_GUNLERI,
  TIP_DOT,
  dateKey,
  getMonthGrid,
  isWeekend,
} from "./takvim-utils";

type Props = {
  date: Date;
  selected: Date;
  byDate: Map<string, TakvimGunu[]>;
  /** "yyyy-MM-dd" → o günün ajanda olayları. */
  ajandaByDate?: Map<string, AjandaOlay[]>;
  onSelect: (date: Date) => void;
  /** Güne çift tıklanınca (yeni etkinlik). */
  onGunCiftTik?: (date: Date) => void;
  onOlayClick?: (olay: AjandaOlay) => void;
};

const MAX_CHIP = 3;

export function TakvimAyGorunumu({
  date,
  selected,
  byDate,
  ajandaByDate,
  onSelect,
  onGunCiftTik,
  onOlayClick,
}: Props) {
  const days = getMonthGrid(date);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {HAFTA_GUNLERI.map((g, i) => (
          <div
            key={g}
            className={cn(
              "p-2 text-center text-xs font-medium text-muted-foreground",
              i >= 5 && "text-red-600/80 dark:text-red-400/80",
            )}
          >
            {g}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const gunler = byDate.get(dateKey(day)) ?? [];
          const olaylar = ajandaByDate?.get(dateKey(day)) ?? [];
          const gorunenOlay = olaylar.slice(0, MAX_CHIP);
          const inMonth = isSameMonth(day, date);
          const isSelected = isSameDay(day, selected);
          const tatil = gunler.some((g) => g.type === "resmi");

          return (
            // İçinde tıklanabilir etkinlik çipleri olduğu için <button> değil.
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(day)}
              onDoubleClick={() => onGunCiftTik?.(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(day);
                }
              }}
              className={cn(
                "flex min-h-20 cursor-pointer flex-col gap-1 sm:min-h-32 border-r border-b p-1.5 text-left transition-colors outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset sm:min-h-24 nth-[7n]:border-r-0",
                isWeekend(day) && "bg-muted/30",
                tatil && "bg-red-50/70 dark:bg-red-950/20",
                !inMonth && "opacity-45",
                isSelected && "ring-2 ring-primary ring-inset",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center self-end rounded-full text-xs font-medium sm:self-start",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isToday(day) && (tatil || day.getDay() === 0) && "text-red-600 dark:text-red-400",
                )}
              >
                {day.getDate()}
              </span>

              {/* Mobilde yer olmadığı için sadece nokta */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {olaylar.slice(0, 3).map((o) => (
                  <span
                    key={o.key}
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: o.renk ?? AJANDA_VARSAYILAN_RENK }}
                  />
                ))}
                {gunler.slice(0, 3).map((g, i) => (
                  <span
                    key={i}
                    className={cn(
                      "size-1.5 rounded-full",
                      TIP_DOT[g.type],
                    )}
                  />
                ))}
              </div>

              {/* Ajanda etkinlikleri üstte */}
              <div className="hidden min-w-0 flex-col gap-1 sm:flex">
                {gorunenOlay.map((o) => (
                  <AjandaOlayChip key={o.key} olay={o} gun={day} compact onClick={onOlayClick} />
                ))}
                {olaylar.length > MAX_CHIP && (
                  <span className="px-1 text-[11px] text-muted-foreground">
                    +{olaylar.length - MAX_CHIP} daha
                  </span>
                )}
              </div>

              {/* Tatil / özel günler hücrenin altında */}
              {gunler.length > 0 && (
                <div className="mt-auto hidden min-w-0 flex-col gap-0.5 sm:flex">
                  {gunler.map((g) => (
                    <TakvimEtkinlik key={g.name} gun={g} compact />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
