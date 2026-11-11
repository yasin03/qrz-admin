"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { TatilFilters } from "@/modules/core/types/sistem/sgk-bordro";
import { DURUM_OPTIONS, RESMI_DINI_OPTIONS } from "./tatil-options";

const durumOptions = [{ value: "ALL", label: "Tümü" }, ...DURUM_OPTIONS];
const resmiDiniOptions = [{ value: "ALL", label: "Tümü" }, ...RESMI_DINI_OPTIONS];

type Props = {
  filters: TatilFilters;
  onChange: (next: TatilFilters) => void;
  onReset: () => void;
};

const TatilFiltre = ({ filters, onChange, onReset }: Props) => {
  const initialFormValues = useMemo<TatilFilters>(
    () => ({
      Durum: filters.Durum ?? "ALL",
      ResmiDini: filters.ResmiDini ?? "ALL",
    }),
    [filters],
  );

  const form = useForm<TatilFilters>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;

      onChange({
        Durum: values.Durum ?? "ALL",
        ResmiDini: values.ResmiDini ?? "ALL",
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Durum: "ALL", ResmiDini: "ALL" });
    onReset();
  };

  const activeCount = [
    filters.Durum !== "ALL",
    filters.ResmiDini !== "ALL",
  ].filter(Boolean).length;

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
        <p className="text-sm font-semibold text-foreground">Tatil Filtrele</p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Durum"
            label="Durum"
            options={durumOptions}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="ResmiDini"
            label="Resmi / Dini"
            options={resmiDiniOptions}
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

export default TatilFiltre;
