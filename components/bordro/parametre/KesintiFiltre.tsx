"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { FormSelect } from "../../forms";
import { CustomDatePicker } from "../../customs/CustomDatePicker";
import { KesintiFilters } from "@/types/bordro-parametre";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";

type FormValues = {
  tarihAraligi: DateRange | undefined;
  KesintiTipi: string;
};

type KesintiFiltreProps = {
  filters: KesintiFilters;
  onChange: (next: KesintiFilters) => void;
  onReset: () => void;
};

const KesintiFiltre = ({ filters, onChange, onReset }: KesintiFiltreProps) => {
  const { kesintiTipleri } = usePersonelSabitTanimlar();

  const kesintiTipiOptions = useMemo(
    () => [{ value: "ALL", label: "Tümü" }, ...kesintiTipleri],
    [kesintiTipleri],
  );

  const initialFormValues = useMemo<FormValues>(
    () => ({
      tarihAraligi: {
        from: filters.Tarih1 ? new Date(filters.Tarih1) : undefined,
        to: filters.Tarih2 ? new Date(filters.Tarih2) : undefined,
      },
      KesintiTipi: filters.KesintiTipi ?? "ALL",
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
      if (name !== "tarihAraligi" && name !== "KesintiTipi") return;

      const range = values.tarihAraligi;
      if (!range?.from || !range?.to) return;

      onChange({
        Tarih1: format(range.from, "yyyy-MM-dd"),
        Tarih2: format(range.to, "yyyy-MM-dd"),
        KesintiTipi: values.KesintiTipi ?? "ALL",
      });
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ tarihAraligi: undefined, KesintiTipi: "ALL" });
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
        <p className="text-sm font-semibold text-foreground">
          Kesinti Filtrele
        </p>

        <div className="space-y-3">
          <CustomDatePicker
            control={form.control}
            name="tarihAraligi"
            label="Tarih Aralığı"
            mode="range"
          />

          <FormSelect
            control={form.control}
            name="KesintiTipi"
            label="Kesinti Tipi"
            options={kesintiTipiOptions}
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

export default KesintiFiltre;
