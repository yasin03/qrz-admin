"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { IzinLimitFilters } from "@/types/sistem/sgk-bordro";
import { NITELIK_OPTIONS } from "./izin-limit-options";

const nitelikOptions = [{ value: "ALL", label: "Tümü" }, ...NITELIK_OPTIONS];

type Props = {
  filters: IzinLimitFilters;
  onChange: (next: IzinLimitFilters) => void;
  onReset: () => void;
};

const IzinLimitFiltre = ({ filters, onChange, onReset }: Props) => {
  const initialFormValues = useMemo<IzinLimitFilters>(
    () => ({ Nitelik: filters.Nitelik ?? "ALL" }),
    [filters],
  );

  const form = useForm<IzinLimitFilters>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;
      onChange({ Nitelik: values.Nitelik ?? "ALL" });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Nitelik: "ALL" });
    onReset();
  };

  const activeCount = filters.Nitelik !== "ALL" ? 1 : 0;

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
          İzin Limiti Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Nitelik"
            label="Nitelik"
            options={nitelikOptions}
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

export default IzinLimitFiltre;
