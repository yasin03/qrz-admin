"use client";

import { format, isSameMonth, isToday, setMonth } from "date-fns";
import { tr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { TakvimGunu } from "@/modules/core/types/takvim";

import { HAFTA_GUNLERI, baskinTip, dateKey, getMonthGrid } from "./takvim-utils";

type Props = {
  date: Date;
  byDate: Map<string, TakvimGunu[]>;
  /** Ay başlığına / bir güne tıklanınca (ay görünümüne geçiş için). */
  onOpenMonth: (date: Date) => void;
};

const GUN_RENK = {
  resmi: "bg-red-500 text-white",
  arife: "bg-yellow-300 text-yellow-950",
  ozel: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
} as const;

export function TakvimYilGorunumu({ date, byDate, onOpenMonth }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => setMonth(date, i));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {months.map((month) => {
        const ayTatilSayisi = getMonthGrid(month).filter(
          (d) => isSameMonth(d, month) && byDate.get(dateKey(d))?.some((g) => g.type === "resmi"),
        ).length;

        return (
          <div key={month.getMonth()} className="rounded-lg border p-3">
            <button
              type="button"
              onClick={() => onOpenMonth(month)}
              className="mb-2 flex w-full items-center justify-between rounded px-1 text-sm font-semibold capitalize hover:text-primary"
            >
              {format(month, "MMMM", { locale: tr })}
              {ayTatilSayisi > 0 && (
                <span className="text-xs font-normal text-muted-foreground normal-case">
                  {ayTatilSayisi} gün tatil
                </span>
              )}
            </button>

            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
              {HAFTA_GUNLERI.map((g) => (
                <div key={g} className="py-1 text-muted-foreground">
                  {g.slice(0, 2)}
                </div>
              ))}
              {getMonthGrid(month).map((day) => {
                if (!isSameMonth(day, month)) return <div key={day.toISOString()} />;
                const gunler = byDate.get(dateKey(day));
                const tip = baskinTip(gunler);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => onOpenMonth(day)}
                    title={gunler?.map((g) => g.name).join("\n")}
                    className={cn(
                      "aspect-square rounded-md leading-none transition-colors hover:ring-1 hover:ring-primary",
                      tip && GUN_RENK[tip],
                      !tip && day.getDay() === 0 && "text-red-600 dark:text-red-400",
                      isToday(day) && "ring-2 ring-primary font-semibold",
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
