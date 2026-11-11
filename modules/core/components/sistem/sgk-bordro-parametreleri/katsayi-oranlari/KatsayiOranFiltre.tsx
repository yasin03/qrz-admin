"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { AY_DATA } from "@/constants/data";
import { KatsayiOranFilters } from "@/modules/core/types/sistem/sgk-bordro";

const ayOptions = [{ value: "ALL", label: "Tümü" }, ...AY_DATA];

type Props = {
  filters: KatsayiOranFilters;
  onChange: (next: KatsayiOranFilters) => void;
  onReset: () => void;
};

const KatsayiOranFiltre = ({ filters, onChange, onReset }: Props) => {
  const initialFormValues = useMemo<KatsayiOranFilters>(
    () => ({ Ay: filters.Ay ?? "ALL" }),
    [filters],
  );

  const form = useForm<KatsayiOranFilters>({
    defaultValues: initialFormValues,
  });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;
      onChange({ Ay: values.Ay ?? "ALL" });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Ay: "ALL" });
    onReset();
  };

  const activeCount = filters.Ay !== "ALL" ? 1 : 0;

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
            name="Ay"
            label="Ay"
            options={ayOptions}
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

export default KatsayiOranFiltre;
