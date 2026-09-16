"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { FormSelect } from "../forms";
import { AvansFilters } from "@/types/avans";
import { CustomDatePicker } from "../customs/CustomDatePicker";

type FormValues = {
  tarihAraligi: DateRange | undefined;
  Durum: AvansFilters["Durum"];
};

type AvansFiltreProps = {
  filters: AvansFilters;
  onChange: (next: AvansFilters) => void;
  onReset: () => void;
};

const durumOptions = [
  { value: "ALL", label: "Tümü" },
  { value: "ONAYLANDI", label: "Onaylandı" },
  { value: "BEKLIYOR", label: "Bekliyor" },
  { value: "REDDEDILDI", label: "Reddedildi" },
];

const AvansFiltre = ({ filters, onChange, onReset }: AvansFiltreProps) => {
  const initialFormValues = useMemo<FormValues>(
    () => ({
      tarihAraligi: {
        from: filters.BaslangicTarihi
          ? new Date(filters.BaslangicTarihi)
          : undefined,
        to: filters.BitisTarihi ? new Date(filters.BitisTarihi) : undefined,
      },
      Durum: filters.Durum ?? "ALL",
    }),
    [filters],
  );

  const form = useForm<FormValues>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name !== "tarihAraligi" && name !== "Durum") return;

      const range = values.tarihAraligi;
      if (!range?.from || !range?.to) return;

      onChange({
        BaslangicTarihi: format(range.from, "yyyy-MM-dd"),
        BitisTarihi: format(range.to, "yyyy-MM-dd"),
        Aciklama: "",
        Durum: values.Durum ?? "ALL",
      });
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ tarihAraligi: undefined, Durum: "ALL" });
    onReset();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" size="sm">
          <Filter className="size-4" />
          Filtre
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-4">
        <p className="text-sm font-semibold text-foreground">Avans Filtrele</p>

        <div className="space-y-3">
          <CustomDatePicker
            control={form.control}
            name="tarihAraligi"
            label="Tarih Aralığı"
            mode="range"
          />

          <FormSelect
            control={form.control}
            name="Durum"
            label="Durum"
            options={durumOptions}
            valueKey="value"
            labelKey="label"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            color="secondary"
            appearance="outline"
            size="sm"
            onClick={handleReset}
          >
            Sıfırla
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AvansFiltre;
