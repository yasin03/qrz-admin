"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { EngelliIndirimFilters } from "@/types/sistem/sgk-bordro";

type Props = {
  filters: EngelliIndirimFilters;
  /** Listede bulunan derece değerleri */
  dereceOptions: string[];
  onChange: (next: EngelliIndirimFilters) => void;
  onReset: () => void;
};

const EngelliIndirimFiltre = ({
  filters,
  dereceOptions,
  onChange,
  onReset,
}: Props) => {
  const dereceSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "Tümü" },
      ...dereceOptions.map((d) => ({ value: d, label: `${d}. Derece` })),
    ],
    [dereceOptions],
  );

  const initialFormValues = useMemo<EngelliIndirimFilters>(
    () => ({ Derece: filters.Derece ?? "ALL" }),
    [filters],
  );

  const form = useForm<EngelliIndirimFilters>({
    defaultValues: initialFormValues,
  });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;
      onChange({ Derece: values.Derece ?? "ALL" });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Derece: "ALL" });
    onReset();
  };

  const activeCount = filters.Derece !== "ALL" ? 1 : 0;

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
          Engelli İndirimi Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Derece"
            label="Derece"
            options={dereceSelectOptions}
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

export default EngelliIndirimFiltre;
