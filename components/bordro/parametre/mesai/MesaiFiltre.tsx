"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { CustomDatePicker } from "@/components/customs/CustomDatePicker";
import { MesaiFilters } from "@/types/bordro-parametre";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { toMesaiTipiOptions } from "./mesai-utils";

type FormValues = {
  tarihAraligi: DateRange | undefined;
  MesaiTipi: string;
  Net: MesaiFilters["Net"];
};

type MesaiFiltreProps = {
  filters: MesaiFilters;
  onChange: (next: MesaiFilters) => void;
  onReset: () => void;
};

const netOptions = [
  { value: "ALL", label: "Tümü" },
  { value: "NET", label: "Net" },
  { value: "BRUT", label: "Brüt" },
];

const MesaiFiltre = ({ filters, onChange, onReset }: MesaiFiltreProps) => {
  const { mesaiTipleri } = usePersonelSabitTanimlar();

  const mesaiTipiOptions = useMemo(
    () => [
      { value: "ALL", label: "Tümü" },
      ...toMesaiTipiOptions(mesaiTipleri),
    ],
    [mesaiTipleri],
  );

  const initialFormValues = useMemo<FormValues>(
    () => ({
      tarihAraligi: {
        from: filters.Tarih1 ? new Date(filters.Tarih1) : undefined,
        to: filters.Tarih2 ? new Date(filters.Tarih2) : undefined,
      },
      MesaiTipi: filters.MesaiTipi ?? "ALL",
      Net: filters.Net ?? "ALL",
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
      if (name !== "tarihAraligi" && name !== "MesaiTipi" && name !== "Net")
        return;

      const range = values.tarihAraligi;
      if (!range?.from || !range?.to) return;

      onChange({
        Tarih1: format(range.from, "yyyy-MM-dd"),
        Tarih2: format(range.to, "yyyy-MM-dd"),
        MesaiTipi: values.MesaiTipi ?? "ALL",
        Net: values.Net ?? "ALL",
      });
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ tarihAraligi: undefined, MesaiTipi: "ALL", Net: "ALL" });
    onReset();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          appearance="outline"
          size="sm"
        >
          <Filter className="size-4" />
          Filtre
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="min-w-96 space-y-4">
        <p className="text-sm font-semibold text-foreground">Mesai Filtrele</p>

        <div className="space-y-3">
          <CustomDatePicker
            control={form.control}
            name="tarihAraligi"
            label="Tarih Aralığı"
            mode="range"
          />

          <FormSelect
            control={form.control}
            name="MesaiTipi"
            label="Mesai Tipi"
            options={mesaiTipiOptions}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="Net"
            label="Net / Brüt"
            options={netOptions}
            valueKey="value"
            labelKey="label"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
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

export default MesaiFiltre;
