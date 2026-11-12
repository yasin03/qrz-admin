"use client";

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
} from "react";
import Link from "next/link";
import { CalendarDays, CalendarRange } from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTakvimGunleri } from "@/modules/core/hooks/use-takvim";
import { TakvimEtkinlik } from "@/modules/core/components/takvim/TakvimEtkinlik";
import {
  TIP_DOT,
  TIP_ETIKET,
} from "@/modules/core/components/takvim/takvim-utils";
import type { TakvimGunu } from "@/modules/core/types/takvim";

// DayButton'ı render içinde tanımlarsak her render'da yeniden mount olur;
// bu yüzden günlerin verisini context ile geçiriyoruz.
const GunlerContext = createContext<Map<string, TakvimGunu[]>>(new Map());

/** Tatil / özel gün olan günlerde hover'da adını gösteren gün butonu. */
function TooltipDayButton(props: ComponentProps<typeof CalendarDayButton>) {
  const byDate = useContext(GunlerContext);
  const gunler = byDate.get(format(props.day.date, "yyyy-MM-dd"));

  if (!gunler?.length) return <CalendarDayButton {...props} />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Trigger ref'i butonun kendi ref'ini ezmesin diye sarmalayıcı */}
        <span className="flex w-full">
          <CalendarDayButton {...props} />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={4}
        className="flex-col items-start gap-1.5 py-2"
      >
        <span className="text-[11px] opacity-70">
          {format(props.day.date, "d MMMM EEEE", { locale: tr })}
        </span>
        {gunler.map((g) => (
          <span key={g.name} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                TIP_DOT[g.type],
              )}
            />
            <span>
              <span className="block font-medium">
                {g.name}
                {g.tahmini && (
                  <span className="font-normal opacity-70"> (tahmini)</span>
                )}
              </span>
              <span className="block text-[11px] opacity-70">
                {TIP_ETIKET[g.type]}
              </span>
            </span>
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/** Header'daki hızlı takvim; tatilleri işaretler ve detaylı takvime yönlendirir. */
export function HeaderCalendar() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState(new Date());

  const { list, byDate } = useTakvimGunleri([month.getFullYear()]);
  const tatiller = list
    .filter((g) => g.type === "resmi")
    .map((g) => parseISO(g.date));
  const arifeler = list
    .filter((g) => g.type === "arife")
    .map((g) => parseISO(g.date));
  const ozelGunler = list
    .filter((g) => g.type === "ozel")
    .map((g) => parseISO(g.date));

  const seciliGunler = selected
    ? (byDate.get(format(selected, "yyyy-MM-dd")) ?? [])
    : [];
  const detayHref = `/takvim?gorunum=ay&tarih=${format(selected ?? new Date(), "yyyy-MM-dd")}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          appearance="outline"
          size="icon"
          aria-label="Takvim"
        >
          <CalendarDays />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <GunlerContext.Provider value={byDate}>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            month={month}
            onMonthChange={setMonth}
            modifiers={{
              tatil: tatiller,
              arife: arifeler,
              ozelGun: ozelGunler,
            }}
            modifiersClassNames={{
              tatil:
                "[&_button]:text-red-600! dark:[&_button]:text-red-400! [&_button]:font-semibold",
              arife:
                "[&_button]:text-yellow-600! dark:[&_button]:text-yellow-400!",
              ozelGun:
                "[&_button]:underline [&_button]:decoration-sky-500 [&_button]:underline-offset-4",
            }}
            components={{ DayButton: TooltipDayButton }}
            className="scale-110 p-4"
          />
        </GunlerContext.Provider>

        {seciliGunler.length > 0 && (
          <div className="mt-2 flex max-w-64 flex-col gap-1">
            {seciliGunler.map((g) => (
              <TakvimEtkinlik key={g.name} gun={g} compact />
            ))}
          </div>
        )}

        <Button
          asChild
          variant="primary"
          appearance="outline"
          className="mt-3 w-full"
        >
          <Link href={detayHref} onClick={() => setOpen(false)}>
            <CalendarRange />
            Detaylı Takvim
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
