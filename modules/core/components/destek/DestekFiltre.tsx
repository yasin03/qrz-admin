"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { DestekTalepFilters } from "@/modules/core/types/destek";
import { DURUM_OPTIONS, ONCELIK_OPTIONS } from "./destek-options";

type Option = { value: string; label: string };

type Props = {
  filters: DestekTalepFilters;
  konuOptions: Option[];
  onChange: (next: DestekTalepFilters) => void;
  onReset: () => void;
};

const ALL_OPTION: Option = { value: "ALL", label: "Tümü" };
const durumOptions = [ALL_OPTION, ...DURUM_OPTIONS];
const oncelikOptions = [ALL_OPTION, ...ONCELIK_OPTIONS];

const DestekFiltre = ({ filters, konuOptions, onChange, onReset }: Props) => {
  const initialFormValues = useMemo<DestekTalepFilters>(
    () => ({
      Durumu: filters.Durumu ?? "ALL",
      Oncelik: filters.Oncelik ?? "ALL",
      Konu: filters.Konu ?? "ALL",
    }),
    [filters],
  );

  const form = useForm<DestekTalepFilters>({
    defaultValues: initialFormValues,
  });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;

      onChange({
        Durumu: values.Durumu ?? "ALL",
        Oncelik: values.Oncelik ?? "ALL",
        Konu: values.Konu ?? "ALL",
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset({ Durumu: "ALL", Oncelik: "ALL", Konu: "ALL" });
    onReset();
  };

  const activeCount = [
    filters.Durumu !== "ALL",
    filters.Oncelik !== "ALL",
    filters.Konu !== "ALL",
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" appearance="outline">
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
          Destek Talebi Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Durumu"
            label="Durum"
            options={durumOptions}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="Oncelik"
            label="Öncelik"
            options={oncelikOptions}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="Konu"
            label="Konu"
            options={[ALL_OPTION, ...konuOptions]}
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

export default DestekFiltre;
