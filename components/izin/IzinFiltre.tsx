// components/izin/IzinFiltre.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { FormSelect } from "../forms";
import { IzinFilters, IzinTipi } from "@/types/izin";
import { CustomDatePicker } from "../customs/CustomDatePicker";

type FormValues = {
  tarihAraligi: DateRange | undefined;
  Aciklama: string; // "ALL" | izinTipi.label
};

type IzinFiltreProps = {
  filters: IzinFilters;
  izinTipleri: IzinTipi[];
  onChange: (next: IzinFilters) => void;
  onReset: () => void;
};

const IzinFiltre = ({
  filters,
  izinTipleri,
  onChange,
  onReset,
}: IzinFiltreProps) => {
  const initialFormValues = useMemo<FormValues>(
    () => ({
      tarihAraligi: {
        from: filters.BaslangicTarihi
          ? new Date(filters.BaslangicTarihi)
          : undefined,
        to: filters.BitisTarihi ? new Date(filters.BitisTarihi) : undefined,
      },
      Aciklama: filters.Aciklama ? filters.Aciklama : "ALL",
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
      if (name !== "tarihAraligi" && name !== "Aciklama") return;

      const range = values.tarihAraligi;
      // Aralık tamamlanmadan (from + to ikisi de seçilmeden) sorguyu tetikleme
      if (!range?.from || !range?.to) return;

      const nextAciklama =
        values.Aciklama === "ALL" ? "" : (values.Aciklama ?? "");

      onChange({
        BaslangicTarihi: format(range.from, "yyyy-MM-dd"),
        BitisTarihi: format(range.to, "yyyy-MM-dd"),
        Aciklama: nextAciklama,
      });
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ tarihAraligi: undefined, Aciklama: "ALL" });
    onReset();
  };

  const aciklamaSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "Tümü" },
      ...izinTipleri.map((tipi) => ({ value: tipi.label, label: tipi.label })),
    ],
    [izinTipleri],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" size="sm">
          <Filter className="size-4" />
          Filtre
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-4">
        <p className="text-sm font-semibold text-foreground">İzin Filtrele</p>

        <div className="space-y-3">
          <CustomDatePicker
            control={form.control}
            name="tarihAraligi"
            label="Tarih Aralığı"
            mode="range"
          />

          <FormSelect
            control={form.control}
            name="Aciklama"
            label="İzin Tipi"
            options={aciklamaSelectOptions}
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

export default IzinFiltre;
