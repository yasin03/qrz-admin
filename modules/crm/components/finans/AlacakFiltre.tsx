"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PARA_BIRIMI_DATA, type ParaBirimi } from "@/constants/data";
import { ODEME_DURUM_SECENEKLERI } from "@/modules/crm/lib/finans";

/**
 * SadeceAcik sunucuda (SP), diğerleri istemcide uygulanır.
 * Boş değer → o alana göre filtrelenmez.
 */
export type AlacakFiltreleri = {
  /** true: kalanı olan + iade bekleyen; false: ödenmişler de. */
  SadeceAcik: boolean;
  OdemeDurumu: "" | "0" | "1" | "2" | "3";
  ParaBirimi: ParaBirimi | "";
};

export const BOS_ALACAK_FILTRELERI: AlacakFiltreleri = { SadeceAcik: true, OdemeDurumu: "", ParaBirimi: "" };

type FormValues = { Kapsam: string; OdemeDurumu: string; ParaBirimi: string };

const TUMU = { value: "ALL", label: "Tümü" };
const KAPSAM_OPTIONS = [
  { value: "acik", label: "Açık alacaklar" },
  { value: "tumu", label: "Ödenmişler dahil" },
];
const ODEME_OPTIONS = [TUMU, ...ODEME_DURUM_SECENEKLERI];
const PARA_OPTIONS = [TUMU, ...PARA_BIRIMI_DATA.map((p) => ({ value: p.value, label: p.value }))];

const bosaCevir = (v: string | undefined) => (!v || v === "ALL" ? "" : v);

const formaCevir = (f: AlacakFiltreleri): FormValues => ({
  Kapsam: f.SadeceAcik ? "acik" : "tumu",
  OdemeDurumu: f.OdemeDurumu || "ALL",
  ParaBirimi: f.ParaBirimi || "ALL",
});

type Props = {
  filters: AlacakFiltreleri;
  onChange: (next: AlacakFiltreleri) => void;
  onReset: () => void;
};

export function AlacakFiltre({ filters, onChange, onReset }: Props) {
  const initialFormValues = useMemo(() => formaCevir(filters), [filters]);
  const form = useForm<FormValues>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values, name }) => {
          if (!name) return;
          onChange({
            SadeceAcik: values.Kapsam !== "tumu",
            OdemeDurumu: bosaCevir(values.OdemeDurumu) as AlacakFiltreleri["OdemeDurumu"],
            ParaBirimi: bosaCevir(values.ParaBirimi) as AlacakFiltreleri["ParaBirimi"],
          });
        },
      }),
    [form, onChange],
  );

  const handleReset = () => {
    form.reset(formaCevir(BOS_ALACAK_FILTRELERI));
    onReset();
  };

  const activeCount = [!filters.SadeceAcik, filters.OdemeDurumu, filters.ParaBirimi].filter(Boolean).length;

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
        <p className="text-sm font-semibold text-foreground">Alacak Filtrele</p>

        <div className="space-y-3">
          <FormSelect control={form.control} name="Kapsam" label="Kapsam" options={KAPSAM_OPTIONS} />
          <FormSelect control={form.control} name="OdemeDurumu" label="Ödeme" options={ODEME_OPTIONS} />
          <FormSelect control={form.control} name="ParaBirimi" label="Para Birimi" options={PARA_OPTIONS} />
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
