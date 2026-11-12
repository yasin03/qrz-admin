"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  isValid,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTakvimGunleri } from "@/modules/core/hooks/use-takvim";
import type { TakvimGorunum } from "@/modules/core/types/takvim";

import { TakvimAyGorunumu } from "./TakvimAyGorunumu";
import { TakvimEtkinlik, TakvimLejant } from "./TakvimEtkinlik";
import { TakvimHaftaGorunumu } from "./TakvimHaftaGorunumu";
import { TakvimYilGorunumu } from "./TakvimYilGorunumu";
import { TIP_DOT, WEEK_OPTS, dateKey } from "./takvim-utils";

const GORUNUMLER: { value: TakvimGorunum; label: string }[] = [
  { value: "hafta", label: "Hafta" },
  { value: "ay", label: "Ay" },
  { value: "yil", label: "Yıl" },
];

const STEP: Record<TakvimGorunum, (d: Date, n: number) => Date> = {
  ay: addMonths,
  hafta: addWeeks,
  yil: addYears,
};

function getRange(view: TakvimGorunum, date: Date) {
  if (view === "hafta")
    return {
      start: startOfWeek(date, WEEK_OPTS),
      end: endOfWeek(date, WEEK_OPTS),
    };
  if (view === "yil") return { start: startOfYear(date), end: endOfYear(date) };
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

function getTitle(view: TakvimGorunum, date: Date) {
  if (view === "yil") return format(date, "yyyy");
  if (view === "ay") return format(date, "MMMM yyyy", { locale: tr });
  const { start, end } = getRange("hafta", date);
  const sameMonth = start.getMonth() === end.getMonth();
  return `${format(start, sameMonth ? "d" : "d MMM", { locale: tr })} – ${format(end, "d MMM yyyy", { locale: tr })}`;
}

/**
 * Ay / hafta / yıl görünümlü takvim. Görünüm ve tarih adreste tutulur
 * (?gorunum=ay&tarih=2026-11-12). useSearchParams kullandığı için
 * page.tsx'te <Suspense> ile sarılmalı.
 */
export default function DetayliTakvim() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get("gorunum");
  const view: TakvimGorunum = GORUNUMLER.some((g) => g.value === viewParam)
    ? (viewParam as TakvimGorunum)
    : "ay";

  const tarihParam = searchParams.get("tarih");
  const parsed = tarihParam ? parseISO(tarihParam) : null;
  const date = useMemo(
    () => (parsed && isValid(parsed) ? parsed : new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tarihParam],
  );

  const update = (next: { view?: TakvimGorunum; date?: Date }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("gorunum", next.view ?? view);
    params.set("tarih", dateKey(next.date ?? date));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const range = getRange(view, date);
  // Ay grid'i önceki/sonraki yılın günlerini de gösterebilir.
  const { list, byDate, isLoading, isFallback } = useTakvimGunleri([
    startOfWeek(range.start, WEEK_OPTS).getFullYear(),
    date.getFullYear(),
    endOfWeek(range.end, WEEK_OPTS).getFullYear(),
  ]);

  const donemGunleri = list.filter((g) =>
    isWithinInterval(parseISO(g.date), range),
  );
  const seciliGunler = byDate.get(dateKey(date)) ?? [];
  const tatilSayisi = new Set(
    donemGunleri.filter((g) => g.type === "resmi").map((g) => g.date),
  ).size;

  return (
    <div className="flex flex-col gap-3">
      {/* Başlık ve kontroller */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold capitalize">
              {getTitle(view, date)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {view === "hafta" && `${getISOWeek(date)}. hafta · `}
              {tatilSayisi > 0
                ? `${tatilSayisi} gün resmî tatil`
                : "Resmî tatil yok"}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="secondary"
              appearance="outline"
              size="icon"
              aria-label="Önceki"
              onClick={() => update({ date: STEP[view](date, -1) })}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="secondary"
              appearance="outline"
              onClick={() => update({ date: new Date() })}
            >
              Bugün
            </Button>
            <Button
              variant="secondary"
              appearance="outline"
              size="icon"
              aria-label="Sonraki"
              onClick={() => update({ date: STEP[view](date, 1) })}
            >
              <ChevronRight />
            </Button>
          </div>

          <Tabs
            value={view}
            onValueChange={(v) => update({ view: v as TakvimGorunum })}
            className="ml-auto min-w-0 flex-1 sm:flex-none"
          >
            <TabsList className="w-full">
              {GORUNUMLER.map((g) => (
                <TabsTrigger
                  key={g.value}
                  value={g.value}
                  className="px-2 sm:px-4"
                >
                  {g.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {(isLoading || isFallback) && (
        <div className="flex flex-wrap items-center gap-2">
          {isLoading && (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner className="size-3" /> Tatiller yükleniyor…
            </span>
          )}
          {isFallback && (
            <span className="inline-flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="size-3.5" />
              Tatil servisine ulaşılamadı, dinî bayramlar gösterilemiyor.
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {view === "ay" && (
            <TakvimAyGorunumu
              date={date}
              selected={date}
              byDate={byDate}
              onSelect={(d) => update({ date: d })}
            />
          )}
          {view === "hafta" && (
            <TakvimHaftaGorunumu
              date={date}
              selected={date}
              byDate={byDate}
              onSelect={(d) => update({ date: d })}
            />
          )}
          {view === "yil" && (
            <TakvimYilGorunumu
              date={date}
              byDate={byDate}
              onOpenMonth={(d) => update({ view: "ay", date: d })}
            />
          )}
          <div className="m-2 ">

          <TakvimLejant />
          </div>
        </div>

        {/* Yan panel */}
        <aside className="flex flex-col gap-4">
          {view !== "yil" && (
            <section className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold">
                {format(date, "d MMMM yyyy, EEEE", { locale: tr })}
              </h2>
              <div className="mt-3 flex flex-col gap-1.5">
                {seciliGunler.length ? (
                  seciliGunler.map((g) => (
                    <TakvimEtkinlik key={g.name} gun={g} />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Bu gün için kayıt yok.
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">
              {view === "yil"
                ? "Yılın"
                : view === "hafta"
                  ? "Haftanın"
                  : "Ayın"}{" "}
              tatil ve özel günleri
            </h2>
            <ul className="mt-3 flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
              {donemGunleri.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  Bu dönemde kayıt yok.
                </li>
              )}
              {donemGunleri.map((g) => {
                const d = parseISO(g.date);
                return (
                  <li key={`${g.date}-${g.name}`}>
                    <button
                      type="button"
                      onClick={() =>
                        update({ view: view === "yil" ? "ay" : view, date: d })
                      }
                      className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          TIP_DOT[g.type],
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">
                          {g.name}
                          {g.tahmini && (
                            <span className="text-muted-foreground">
                              {" "}
                              (tahmini)
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {format(d, "d MMMM, EEEE", { locale: tr })}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
