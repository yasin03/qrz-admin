"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Filter } from "lucide-react";

import { FormInput, FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ODEME_SEKLI_SECENEKLERI,
  TAHSILAT_DONEMLERI,
  TAHSILAT_TIP_SECENEKLERI,
  type TahsilatDonem,
} from "@/modules/crm/lib/finans";

/**
 * Dönem / tarihler ve Tip sunucuda (SP), ödeme şekli istemcide uygulanır.
 * Boş değer → o alana göre filtrelenmez.
 */
export type TahsilatFiltreleri = {
  Donem: TahsilatDonem;
  /** Sadece Donem = "ozel" iken; "yyyy-MM-dd". */
  Baslangic: string;
  Bitis: string;
  Tip: "" | "1" | "2";
  OdemeSekli: "" | "1" | "2" | "3" | "4" | "5";
};

export const BOS_TAHSILAT_FILTRELERI: TahsilatFiltreleri = {
  Donem: "buAy",
  Baslangic: "",
  Bitis: "",
  Tip: "",
  OdemeSekli: "",
};

type FormValues = { Donem: string; Baslangic: string; Bitis: string; Tip: string; OdemeSekli: string };

const TUMU = { value: "ALL", label: "Tümü" };
const DONEM_OPTIONS = [...TAHSILAT_DONEMLERI];
const TIP_OPTIONS = [TUMU, ...TAHSILAT_TIP_SECENEKLERI];
const SEKIL_OPTIONS = [TUMU, ...ODEME_SEKLI_SECENEKLERI];

const bosaCevir = (v: string | undefined) => (!v || v === "ALL" ? "" : v);

const formaCevir = (f: TahsilatFiltreleri): FormValues => ({
  Donem: f.Donem,
  Baslangic: f.Baslangic,
  Bitis: f.Bitis,
  Tip: f.Tip || "ALL",
  OdemeSekli: f.OdemeSekli || "ALL",
});

type Props = {
  filters: TahsilatFiltreleri;
  onChange: (next: TahsilatFiltreleri) => void;
  onReset: () => void;
};

export function TahsilatFiltre({ filters, onChange, onReset }: Props) {
  const initialFormValues = useMemo(() => formaCevir(filters), [filters]);
  const form = useForm<FormValues>({ defaultValues: initialFormValues });
  const donem = useWatch({ control: form.control, name: "Donem" });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values, name }) => {
          if (!name) return;
          const ozel = values.Donem === "ozel";
          onChange({
            Donem: (values.Donem || "buAy") as TahsilatDonem,
            Baslangic: ozel ? values.Baslangic : "",
            Bitis: ozel ? values.Bitis : "",
            Tip: bosaCevir(values.Tip) as TahsilatFiltreleri["Tip"],
            OdemeSekli: bosaCevir(values.OdemeSekli) as TahsilatFiltreleri["OdemeSekli"],
          });
        },
      }),
    [form, onChange],
  );

  const handleReset = () => {
    form.reset(formaCevir(BOS_TAHSILAT_FILTRELERI));
    onReset();
  };

  const activeCount = [filters.Donem !== BOS_TAHSILAT_FILTRELERI.Donem, filters.Tip, filters.OdemeSekli].filter(
    Boolean,
  ).length;

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
        <p className="text-sm font-semibold text-foreground">Tahsilat Filtrele</p>

        <div className="space-y-3">
          <FormSelect control={form.control} name="Donem" label="Dönem" options={DONEM_OPTIONS} />
          {donem === "ozel" && (
            <>
              <FormInput control={form.control} name="Baslangic" label="Başlangıç" type="date" vertical />
              <FormInput control={form.control} name="Bitis" label="Bitiş" type="date" vertical />
            </>
          )}
          <FormSelect control={form.control} name="Tip" label="Kayıt Tipi" options={TIP_OPTIONS} />
          <FormSelect control={form.control} name="OdemeSekli" label="Ödeme Şekli" options={SEKIL_OPTIONS} />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="secondary" appearance="outline" size="sm" onClick={handleReset}>
            Sıfırla
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
