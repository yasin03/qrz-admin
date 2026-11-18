"use client";

import { useMemo, useState } from "react";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { useAjanda } from "@/modules/core/hooks/use-ajanda";
import type { TakvimGunu } from "@/modules/core/types/takvim";

import { WEEK_OPTS, dateKey } from "./takvim-utils";

type Props = {
  /** Büyük takvimde seçili tarih. */
  date: Date;
  byDate: Map<string, TakvimGunu[]>;
  onSelect: (date: Date) => void;
};

/**
 * Sol paneldeki ay görünümlü mini takvim. Kendi içinde ay ileri/geri
 * gezilebilir; büyük takvimde tarih değişince o aya döner.
 */
export function TakvimMiniAy({ date, byDate, onSelect }: Props) {
  const [ay, setAy] = useState(date);
  const [oncekiTarih, setOncekiTarih] = useState(dateKey(date));

  // Dışarıdan tarih değişince mini takvim o aya gelsin.
  if (oncekiTarih !== dateKey(date)) {
    setOncekiTarih(dateKey(date));
    setAy(date);
  }

  // Mini takvimde görünen ayın etkinlikleri (büyük takvimle aynı aydaysa
  // react-query aynı sorguyu paylaşır, ek istek atılmaz).
  const { byDate: ajandaByDate } = useAjanda(
    startOfWeek(startOfMonth(ay), WEEK_OPTS),
    endOfDay(endOfWeek(endOfMonth(ay), WEEK_OPTS)),
  );

  const modifiers = useMemo(() => {
    const etkinlik = [...ajandaByDate.keys()].map((k) => parseISO(k));
    const resmi: Date[] = [];
    const arife: Date[] = [];
    const ozel: Date[] = [];
    for (const [key, gunler] of byDate) {
      const d = parseISO(key);
      const tip = gunler[0]?.type; // liste resmi > arife > ozel sıralı
      if (tip === "resmi") resmi.push(d);
      else if (tip === "arife") arife.push(d);
      else if (tip === "ozel") ozel.push(d);
    }
    return { resmi, arife, ozel, etkinlik };
  }, [byDate, ajandaByDate]);

  return (
    <Calendar
      mode="single"
      required
      selected={date}
      onSelect={(d) => d && onSelect(d)}
      month={ay}
      onMonthChange={setAy}
      captionLayout="label"
      modifiers={modifiers}
      modifiersClassNames={{
        resmi:
          "[&>button]:bg-red-500/15 [&>button]:text-red-600 dark:[&>button]:text-red-400",
        arife:
          "[&>button]:bg-yellow-400/25 [&>button]:text-yellow-800 dark:[&>button]:text-yellow-300",
        // Özel gün: sağ üst köşede mavi nokta
        ozel: "after:pointer-events-none after:absolute after:top-0.5 after:right-0.5 after:z-20 after:size-1 after:rounded-full after:bg-sky-500",
        // Etkinlik: altta ortada nokta (seçili günde açık renk)
        etkinlik:
          "before:pointer-events-none before:absolute before:bottom-0.5 before:left-1/2 before:z-20 before:size-1 before:-translate-x-1/2 before:rounded-full before:bg-primary data-[selected=true]:before:bg-primary-foreground",
      }}
      className="mx-auto p-0 text-xs [--cell-size:--spacing(7)]"
    />
  );
}
