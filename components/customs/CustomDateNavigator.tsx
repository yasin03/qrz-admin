"use client";

import { useState } from "react";
import {
  addDays,
  addMonths,
  addYears,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  setMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type NavigatorMode = "day" | "month";

const MODE_CONFIG: Record<
  NavigatorMode,
  {
    valueFormat: string;
    displayFormat: string;
    step: (date: Date, amount: number) => Date;
    jump: (date: Date, amount: number) => Date;
    stepLabel: [string, string];
    jumpLabel: [string, string];
    todayLabel: string;
    isCurrent: (date: Date) => boolean;
  }
> = {
  day: {
    valueFormat: "yyyy-MM-dd",
    displayFormat: "d MMMM yyyy, EEE",
    step: addDays,
    jump: addMonths,
    stepLabel: ["Önceki gün", "Sonraki gün"],
    jumpLabel: ["Önceki ay", "Sonraki ay"],
    todayLabel: "Bugün",
    isCurrent: (date) => isSameDay(date, new Date()),
  },
  month: {
    valueFormat: "yyyy-MM",
    displayFormat: "MMMM yyyy",
    step: addMonths,
    jump: addYears,
    stepLabel: ["Önceki ay", "Sonraki ay"],
    jumpLabel: ["Önceki yıl", "Sonraki yıl"],
    todayLabel: "Bu Ay",
    isCurrent: (date) => isSameMonth(date, new Date()),
  },
};

type CustomDateNavigatorProps = {
  /**
   * - `"day"`   (default): "yyyy-MM-dd" — ‹ › gün, « » ay atlar, takvim açılır
   * - `"month"`: "yyyy-MM"    — ‹ › ay, « » yıl atlar, ay seçici açılır
   */
  mode?: NavigatorMode;
  /** mode="day" → "yyyy-MM-dd", mode="month" → "yyyy-MM" */
  value: string;
  onChange: (value: string) => void;
  /** Ekranda gösterilen format. Default: day → "d MMMM yyyy, EEE", month → "MMMM yyyy" */
  displayFormat?: string;
  /** Dıştaki « » atlama butonlarını göster (day: ay, month: yıl). Default: true */
  showJumpButtons?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Form'a bağlı olmayan tarih gezgini.
 *
 *   « ‹ [📅 12 Ekim 2026, Pzt] › »     mode="day"
 *   « ‹ [📅 Ekim 2026] › »             mode="month"
 *
 * Ay atlarken ay sonu taşarsa ayın son gününe oturur (31 Oca → 28 Şub).
 *
 *   <CustomDateNavigator value={tarih} onChange={setTarih} />
 *   <CustomDateNavigator mode="month" value={`${yil}-${ay}`} onChange={...} />
 */
export function CustomDateNavigator({
  mode = "day",
  value,
  onChange,
  displayFormat,
  showJumpButtons = true,
  disabled = false,
  className,
}: CustomDateNavigatorProps) {
  const config = MODE_CONFIG[mode];
  const [open, setOpen] = useState(false);

  const parsed = parse(value, config.valueFormat, new Date());
  const date = isValid(parsed) ? parsed : new Date();

  const go = (next: Date) => onChange(format(next, config.valueFormat));
  const select = (next: Date) => {
    go(next);
    setOpen(false);
  };

  const navButtonClass =
    "flex h-full w-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

  return (
    <div
      className={cn(
        "flex h-8 w-fit items-center rounded-lg border border-input bg-background",
        className,
      )}
    >
      {showJumpButtons && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => go(config.jump(date, -1))}
          aria-label={config.jumpLabel[0]}
          title={config.jumpLabel[0]}
          className={cn(navButtonClass, "rounded-l-lg")}
        >
          <ChevronsLeft className="size-4" />
        </button>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => go(config.step(date, -1))}
        aria-label={config.stepLabel[0]}
        title={config.stepLabel[0]}
        className={cn(navButtonClass, !showJumpButtons && "rounded-l-lg")}
      >
        <ChevronLeft className="size-4" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex h-full items-center gap-1.5 border-x border-input px-2.5 text-sm whitespace-nowrap hover:bg-muted disabled:opacity-50"
          >
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="tabular-nums">
              {format(date, displayFormat ?? config.displayFormat, {
                locale: tr,
              })}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent align="center" className="w-auto p-0">
          {mode === "day" ? (
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(selected) => selected && select(selected)}
              locale={tr}
            />
          ) : (
            <MonthGrid value={date} onSelect={select} />
          )}
          <div className="flex justify-end border-t border-border p-2">
            <Button
              type="button"
              variant="secondary"
              appearance="outline"
              size="sm"
              disabled={config.isCurrent(date)}
              onClick={() => select(new Date())}
            >
              {config.todayLabel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        disabled={disabled}
        onClick={() => go(config.step(date, 1))}
        aria-label={config.stepLabel[1]}
        title={config.stepLabel[1]}
        className={cn(navButtonClass, !showJumpButtons && "rounded-r-lg")}
      >
        <ChevronRight className="size-4" />
      </button>
      {showJumpButtons && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => go(config.jump(date, 1))}
          aria-label={config.jumpLabel[1]}
          title={config.jumpLabel[1]}
          className={cn(navButtonClass, "rounded-r-lg")}
        >
          <ChevronsRight className="size-4" />
        </button>
      )}
    </div>
  );
}

/** mode="month" popover'ı: üstte yıl gezintisi, altında 12 aylık grid. */
function MonthGrid({
  value,
  onSelect,
}: {
  value: Date;
  onSelect: (date: Date) => void;
}) {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const now = new Date();

  return (
    <div className="w-64 space-y-2 p-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          appearance="ghost"
          size="icon-sm"
          onClick={() => setViewYear((y) => y - 1)}
          aria-label="Önceki yıl"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium tabular-nums">{viewYear}</span>
        <Button
          type="button"
          variant="secondary"
          appearance="ghost"
          size="icon-sm"
          onClick={() => setViewYear((y) => y + 1)}
          aria-label="Sonraki yıl"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }, (_, month) => {
          const monthDate = setMonth(new Date(viewYear, 0, 1), month);
          const isSelected =
            value.getFullYear() === viewYear && value.getMonth() === month;
          const isCurrent =
            now.getFullYear() === viewYear && now.getMonth() === month;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelect(monthDate)}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm capitalize transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                !isSelected && isCurrent && "font-semibold text-primary",
              )}
            >
              {format(monthDate, "LLL", { locale: tr })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
