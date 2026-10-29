"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { KatsayiFilters } from "@/types/ayarlar/katsayi";

// Veride "Tümü" diye gerçek bir Tipi değeri olduğu için "hepsi" seçeneği ayrı tutuluyor.
const ALL = "__ALL__";

type FormValues = {
  Yil: string;
  Tipi: string;
};

type Props = {
  filters: KatsayiFilters;
  /** Session'daki yıl — filtrede yıl seçilmediyse bu kullanılır. */
  defaultYil: string;
  tipiOptions: string[];
  onChange: (next: KatsayiFilters) => void;
  onReset: () => void;
};

const KatsayiFiltre = ({
  filters,
  defaultYil,
  tipiOptions,
  onChange,
  onReset,
}: Props) => {
  const yilOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => {
      const value = String(currentYear - i);
      return { value, label: value };
    });
  }, []);

  const tipiSelectOptions = useMemo(
    () => [
      { value: ALL, label: "Hepsi" },
      ...tipiOptions.map((tipi) => ({ value: tipi, label: tipi })),
    ],
    [tipiOptions],
  );

  const initialFormValues = useMemo<FormValues>(
    () => ({
      Yil: filters.Yil ?? defaultYil,
      Tipi: filters.Tipi || ALL,
    }),
    [filters, defaultYil],
  );

  const form = useForm<FormValues>({
    defaultValues: initialFormValues,
  });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;

      onChange({
        Yil:
          !values.Yil || values.Yil === defaultYil ? null : String(values.Yil),
        Tipi: !values.Tipi || values.Tipi === ALL ? "" : values.Tipi,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange, defaultYil]);

  const handleReset = () => {
    form.reset({ Yil: defaultYil, Tipi: ALL });
    onReset();
  };

  const activeCount = [filters.Yil !== null, filters.Tipi].filter(
    Boolean,
  ).length;

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
          {activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          Katsayı Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Yil"
            label="Yıl"
            options={yilOptions}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="Tipi"
            label="Tipi"
            options={tipiSelectOptions}
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

export default KatsayiFiltre;
