"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { KidemIhbarFilters } from "@/modules/core/types/sistem/sgk-bordro";
import { TIP_OPTIONS } from "./kidem-ihbar-options";

const tipOptions = [{ value: "ALL", label: "Tümü" }, ...TIP_OPTIONS];

type Props = {
  filters: KidemIhbarFilters;
  onChange: (next: KidemIhbarFilters) => void;
  onReset: () => void;
};

const KidemIhbarFiltre = ({ filters, onChange, onReset }: Props) => {
  const initialFormValues = useMemo<KidemIhbarFilters>(
    () => ({ Tip: filters.Tip ?? "ALL" }),
    [filters],
  );

  const form = useForm<KidemIhbarFilters>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;
      onChange({ Tip: values.Tip ?? "ALL" });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Tip: "ALL" });
    onReset();
  };

  const activeCount = filters.Tip !== "ALL" ? 1 : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          appearance="outline"
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
          Kıdem İhbar Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Tip"
            label="Tip"
            options={tipOptions}
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

export default KidemIhbarFiltre;
