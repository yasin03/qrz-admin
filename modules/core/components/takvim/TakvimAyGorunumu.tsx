"use client";

import { isSameDay, isSameMonth, isToday } from "date-fns";

import { cn } from "@/lib/utils";
import type { TakvimGunu } from "@/modules/core/types/takvim";

import { TakvimEtkinlik } from "./TakvimEtkinlik";
import { HAFTA_GUNLERI, TIP_DOT, dateKey, getMonthGrid, isWeekend } from "./takvim-utils";

type Props = {
  date: Date;
  selected: Date;
  byDate: Map<string, TakvimGunu[]>;
  onSelect: (date: Date) => void;
};

const MAX_CHIP = 2;

export function TakvimAyGorunumu({ date, selected, byDate, onSelect }: Props) {
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
          const inMonth = isSameMonth(day, date);
          const isSelected = isSameDay(day, selected);
          const tatil = gunler.some((g) => g.type === "resmi");

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "flex min-h-20 flex-col gap-1 border-r border-b p-1.5 text-left transition-colors outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset sm:min-h-24 nth-[7n]:border-r-0",
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
              <div className="flex gap-0.5 sm:hidden">
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

              <div className="hidden flex-col gap-0.5 sm:flex">
                {gunler.slice(0, MAX_CHIP).map((g) => (
                  <TakvimEtkinlik key={g.name} gun={g} compact />
                ))}
                {gunler.length > MAX_CHIP && (
                  <span className="px-1 text-[11px] text-muted-foreground">
                    +{gunler.length - MAX_CHIP} daha
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
