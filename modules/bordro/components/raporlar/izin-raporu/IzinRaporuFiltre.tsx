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
import { FormSelect, FormSwitch } from "@/components/forms";
import { CustomDatePicker } from "@/components/customs/CustomDatePicker";
import SirketSubeFiltre from "@/modules/core/components/genel/SirketSubeFiltre";
import type { SirketSubeFiltreResult } from "@/modules/core/hooks/genel/use-sirket-sube-filtre";
import { IzinRaporFilters, IzinRaporTuru } from "@/modules/bordro/types/rapor";

type FormValues = {
  raporTuru: IzinRaporTuru;
  BaslangicTarihi: Date | undefined;
  BitisTarihi: Date | undefined;
  CikisVar: boolean;
};

type Props = {
  filters: IzinRaporFilters;
  /** Şirket/şube seçimi useSirketSubeFiltre state'inde tutulur */
  sirketSube: SirketSubeFiltreResult;
  onChange: (next: IzinRaporFilters) => void;
  onReset: () => void;
  /**
   * Popover açık durumu üst bileşende tutulur: rapor türü değişince filtre
   * başka bir tablo bileşeninde yeniden mount ediliyor, açık kalsın diye.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RAPOR_TURU_OPTIONS: { value: IzinRaporTuru; label: string }[] = [
  { value: "genel", label: "Genel İzin Kullanımları" },
  { value: "yillik", label: "Yıllık Toplam İzin Kullanımları" },
];

const toDate = (value: string) => parse(value, "yyyy-MM-dd", new Date());

const toFormValues = (filters: IzinRaporFilters): FormValues => ({
  raporTuru: filters.raporTuru,
  BaslangicTarihi: toDate(filters.BaslangicTarihi),
  BitisTarihi: toDate(filters.BitisTarihi),
  CikisVar: filters.CikisVar,
});

const IzinRaporuFiltre = ({
  filters,
  sirketSube,
  onChange,
  onReset,
  open,
  onOpenChange,
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
        raporTuru: values.raporTuru ?? "genel",
        BaslangicTarihi: format(values.BaslangicTarihi, "yyyy-MM-dd"),
        BitisTarihi: format(values.BitisTarihi, "yyyy-MM-dd"),
        CikisVar: Boolean(values.CikisVar),
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const [raporTuru, baslangic, bitis, cikisVar] = useWatch({
    control: form.control,
    name: ["raporTuru", "BaslangicTarihi", "BitisTarihi", "CikisVar"],
  });
  // Yıllık raporda sadece bitiş tarihi kullanılıyor
  const sadeceBitis = raporTuru === "yillik";

  const aktifFiltreSayisi =
    Number(sirketSube.IDSube !== "0") + Number(Boolean(cikisVar));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
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
          İzin Raporu Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="raporTuru"
            label="Rapor Türü"
            options={RAPOR_TURU_OPTIONS}
          />

          {!sadeceBitis && (
            <CustomDatePicker
              control={form.control}
              name="BaslangicTarihi"
              label="Başlangıç Tarihi"
              clearable={false}
              toDate={bitis}
            />
          )}

          <CustomDatePicker
            control={form.control}
            name="BitisTarihi"
            label="Bitiş Tarihi"
            clearable={false}
            // Başlangıç bitişten sonra, bitiş başlangıçtan önce seçilemesin
            fromDate={sadeceBitis ? undefined : baslangic}
          />

          <SirketSubeFiltre {...sirketSube} />

          <FormSwitch
            control={form.control}
            name="CikisVar"
            label="Çıkış Yapanları Göster"
          />
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

export default IzinRaporuFiltre;
