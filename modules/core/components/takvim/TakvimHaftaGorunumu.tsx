"use client";

import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { TakvimGunu } from "@/modules/core/types/takvim";

import { TakvimEtkinlik } from "./TakvimEtkinlik";
import { WEEK_OPTS, dateKey, isWeekend } from "./takvim-utils";

type Props = {
  date: Date;
  selected: Date;
  byDate: Map<string, TakvimGunu[]>;
  onSelect: (date: Date) => void;
};

export function TakvimHaftaGorunumu({ date, selected, byDate, onSelect }: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(date, WEEK_OPTS),
    end: endOfWeek(date, WEEK_OPTS),
  });

  return (
    <div className="grid gap-2 md:grid-cols-7 md:gap-0 md:overflow-hidden md:rounded-lg md:border">
      {days.map((day) => {
        const gunler = byDate.get(dateKey(day)) ?? [];
        const isSelected = isSameDay(day, selected);
        const tatil = gunler.some((g) => g.type === "resmi");

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col rounded-lg border text-left transition-colors outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 md:min-h-96 md:rounded-none md:border-0 md:border-r md:last:border-r-0",
              isWeekend(day) && "bg-muted/30",
              tatil && "bg-red-50/70 dark:bg-red-950/20",
              isSelected && "ring-2 ring-primary ring-inset",
            )}
          >
            <div className="flex items-center gap-2 border-b px-3 py-2 md:flex-col md:gap-0.5 md:py-3">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {format(day, "EEE", { locale: tr })}
              </span>
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full text-base font-semibold",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isToday(day) && (tatil || day.getDay() === 0) && "text-red-600 dark:text-red-400",
                )}
              >
                {day.getDate()}
              </span>
              <span className="text-xs text-muted-foreground md:hidden">
                {format(day, "MMMM", { locale: tr })}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-2">
              {gunler.length ? (
                gunler.map((g) => <TakvimEtkinlik key={g.name} gun={g} />)
              ) : (
                <span className="hidden py-2 text-center text-xs text-muted-foreground/60 md:block">—</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
