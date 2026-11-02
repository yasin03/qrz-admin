"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { VergiOranFilters } from "@/types/sistem/sgk-bordro";
import { formatYuzde } from "./vergi-oran-options";

type Props = {
  filters: VergiOranFilters;
  /** Listede bulunan yüzde değerleri */
  yuzdeOptions: string[];
  onChange: (next: VergiOranFilters) => void;
  onReset: () => void;
};

const VergiOranFiltre = ({
  filters,
  yuzdeOptions,
  onChange,
  onReset,
}: Props) => {
  const yuzdeSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "Tümü" },
      ...yuzdeOptions.map((y) => ({ value: y, label: formatYuzde(y) })),
    ],
    [yuzdeOptions],
  );

  const initialFormValues = useMemo<VergiOranFilters>(
    () => ({ Yuzde: filters.Yuzde ?? "ALL" }),
    [filters],
  );

  const form = useForm<VergiOranFilters>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;
      onChange({ Yuzde: values.Yuzde ?? "ALL" });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Yuzde: "ALL" });
    onReset();
  };

  const activeCount = filters.Yuzde !== "ALL" ? 1 : 0;

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
          Vergi Oranı Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Yuzde"
            label="Yüzde"
            options={yuzdeSelectOptions}
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

export default VergiOranFiltre;
