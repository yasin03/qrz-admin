"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { format, parse } from "date-fns";
import { Filter } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/customs/CustomDatePicker";
import SirketSubeFiltre from "@/modules/core/components/genel/SirketSubeFiltre";
import type { SirketSubeFiltreResult } from "@/modules/core/hooks/genel/use-sirket-sube-filtre";
import { AvansRaporFilters } from "@/modules/bordro/types/rapor";

type FormValues = {
  BaslangicTarihi: Date | undefined;
  BitisTarihi: Date | undefined;
};

type Props = {
  filters: AvansRaporFilters;
  /** Şirket/şube seçimi useSirketSubeFiltre state'inde tutulur */
  sirketSube: SirketSubeFiltreResult;
  onChange: (next: AvansRaporFilters) => void;
  onReset: () => void;
};

const toDate = (value: string) => parse(value, "yyyy-MM-dd", new Date());

const toFormValues = (filters: AvansRaporFilters): FormValues => ({
  BaslangicTarihi: toDate(filters.BaslangicTarihi),
  BitisTarihi: toDate(filters.BitisTarihi),
});

const AvansRaporuFiltre = ({
  filters,
  sirketSube,
  onChange,
  onReset,
}: Props) => {
  const form = useForm<FormValues>({ defaultValues: toFormValues(filters) });

  useEffect(() => {
    form.reset(toFormValues(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name || !values.BaslangicTarihi || !values.BitisTarihi) return;

      onChange({
        BaslangicTarihi: format(values.BaslangicTarihi, "yyyy-MM-dd"),
        BitisTarihi: format(values.BitisTarihi, "yyyy-MM-dd"),
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  // Başlangıç bitişten sonra, bitiş başlangıçtan önce seçilemesin
  const [baslangic, bitis] = useWatch({
    control: form.control,
    name: ["BaslangicTarihi", "BitisTarihi"],
  });

  const aktifFiltreSayisi = Number(sirketSube.IDSube !== "0");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" appearance="outline">
          <Filter className="size-4" />
          Filtre
          {aktifFiltreSayisi > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {aktifFiltreSayisi}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="min-w-96 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          Avans Raporu Filtrele
        </p>

        <div className="space-y-3">
          <CustomDatePicker
            control={form.control}
            name="BaslangicTarihi"
            label="Başlangıç Tarihi"
            clearable={false}
            toDate={bitis}
          />

          <CustomDatePicker
            control={form.control}
            name="BitisTarihi"
            label="Bitiş Tarihi"
            clearable={false}
            fromDate={baslangic}
          />

          <SirketSubeFiltre {...sirketSube} />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            appearance="outline"
            size="sm"
            onClick={onReset}
          >
            Sıfırla
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AvansRaporuFiltre;
