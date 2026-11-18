"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfDay,
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
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAjanda, useAjandaDetay } from "@/modules/core/hooks/use-ajanda";
import { detaydanOlay } from "@/modules/core/lib/ajanda";
import { useTakvimGunleri } from "@/modules/core/hooks/use-takvim";
import type { AjandaOlay, TakvimGorunum } from "@/modules/core/types/takvim";

import { AjandaDetayDialog } from "./AjandaDetayDialog";
import { AjandaFormDialog, type AjandaFormModu } from "./AjandaFormDialog";
import { AjandaOlayChip } from "./AjandaOlayChip";
import { TakvimAyGorunumu } from "./TakvimAyGorunumu";
import { TakvimEtkinlik, TakvimLejant } from "./TakvimEtkinlik";
import { TakvimHaftaGorunumu } from "./TakvimHaftaGorunumu";
import { TakvimMiniAy } from "./TakvimMiniAy";
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

  // Ajanda: ay görünümünde grid'in tamamı (önceki/sonraki ayın günleri dahil).
  const ajandaBas = view === "ay" ? startOfWeek(range.start, WEEK_OPTS) : range.start;
  const ajandaSon = endOfDay(view === "ay" ? endOfWeek(range.end, WEEK_OPTS) : range.end);
  const ajanda = useAjanda(ajandaBas, ajandaSon, view !== "yil");
  const seciliOlaylar = ajanda.byDate.get(dateKey(date)) ?? [];

  const [formMod, setFormMod] = useState<AjandaFormModu | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detayOlay, setDetayOlay] = useState<AjandaOlay | null>(null);
  const [detayOpen, setDetayOpen] = useState(false);

  const yeniEtkinlik = (tarih: Date) => {
    setFormMod({ tip: "yeni", tarih });
    setFormOpen(true);
  };
  const olayAc = (olay: AjandaOlay) => {
    setDetayOlay(olay);
    setDetayOpen(true);
  };

  // Mail linki: ?ajanda=ID&tarih=... → ilgili etkinliğin detayı açılır.
  // Önce yüklü takvimde (tercihen o gündeki tekrar) aranır, yoksa detay çekilir.
  const linkID = searchParams.get("ajanda");
  const listedeki = linkID
    ? (seciliOlaylar.find((o) => o.IDAjanda === linkID || o.IDAjandaSeri === linkID) ??
      ajanda.olaylar.find((o) => o.IDAjanda === linkID || o.IDAjandaSeri === linkID))
    : undefined;
  const linkDetay = useAjandaDetay(linkID && !listedeki && !ajanda.isLoading ? linkID : null);
  const linkOlay = listedeki ?? (linkDetay.data ? detaydanOlay(linkDetay.data) : null);

  const detayKapat = (open: boolean) => {
    setDetayOpen(open);
    if (!open && linkID) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("ajanda");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };
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
          <Button className="shrink-0" onClick={() => yeniEtkinlik(date)}>
            <Plus /> <span className="hidden sm:inline">Yeni</span>
          </Button>
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

      {(isLoading || isFallback || ajanda.isError) && (
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
          {ajanda.isError && (
            <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="size-3.5" />
              Ajanda kayıtları yüklenemedi.
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[264px_1fr]">
        {/* Sol panel: mini takvim + seçili gün + dönem listesi */}
        <aside className="flex flex-col gap-4 xl:order-first">
          <section className="rounded-lg border px-2 py-3">
            <TakvimMiniAy
              date={date}
              byDate={byDate}
              onSelect={(d) => update({ view: view === "yil" ? "ay" : view, date: d })}
            />
          </section>

          {view !== "yil" && (
            <section className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {format(date, "d MMMM yyyy, EEEE", { locale: tr })}
                </h2>
                <Button
                  size="icon-xs"
                  variant="secondary"
                  appearance="ghost"
                  aria-label="Bu güne etkinlik ekle"
                  title="Bu güne etkinlik ekle"
                  onClick={() => yeniEtkinlik(date)}
                >
                  <Plus />
                </Button>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {seciliOlaylar.map((o) => (
                  <AjandaOlayChip key={o.key} olay={o} gun={date} onClick={olayAc} />
                ))}
                {seciliGunler.map((g) => (
                  <TakvimEtkinlik key={g.name} gun={g} />
                ))}
                {!seciliOlaylar.length && !seciliGunler.length && (
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
            <ul className="mt-3 flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
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

        {/* Sağ: büyük takvim */}
        <div className="order-first min-w-0 xl:order-0">
          {view === "ay" && (
            <TakvimAyGorunumu
              date={date}
              selected={date}
              byDate={byDate}
              ajandaByDate={ajanda.byDate}
              onSelect={(d) => update({ date: d })}
              onGunCiftTik={yeniEtkinlik}
              onOlayClick={olayAc}
            />
          )}
          {view === "hafta" && (
            <TakvimHaftaGorunumu
              date={date}
              selected={date}
              byDate={byDate}
              ajandaByDate={ajanda.byDate}
              onSelect={(d) => update({ date: d })}
              onGunCiftTik={yeniEtkinlik}
              onOlayClick={olayAc}
            />
          )}
          {view === "yil" && (
            <TakvimYilGorunumu
              date={date}
              byDate={byDate}
              onOpenMonth={(d) => update({ view: "ay", date: d })}
            />
          )}
          <div className="m-2">
            <TakvimLejant />
          </div>
        </div>
      </div>

      <AjandaFormDialog open={formOpen} onOpenChange={setFormOpen} mod={formMod} />
      <AjandaDetayDialog
        open={detayOpen || Boolean(linkOlay)}
        onOpenChange={detayKapat}
        olay={detayOpen ? detayOlay : (linkOlay ?? detayOlay)}
        onDuzenle={(mod) => {
          setFormMod(mod);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
