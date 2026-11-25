"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PARA_BIRIMI_DATA, type ParaBirimi } from "@/constants/data";
import { ODEME_DURUM_SECENEKLERI } from "@/modules/crm/lib/finans";
import { SATIS_DURUM, SATIS_TIPI_SECENEKLERI } from "@/modules/crm/lib/satis";

/** Boş değer → o alana göre filtrelenmez. Hepsi istemci tarafında uygulanır. */
export type SatisFiltreleri = {
  /** "0" Geçerli, "1" İptal */
  Durum: "" | "0" | "1";
  SatisTipi: "" | "1" | "2" | "3";
  /** Rozet durumu: "0".."3" (finans rozet sorgusundan hesaplanır). */
  OdemeDurumu: "" | "0" | "1" | "2" | "3";
  ParaBirimi: ParaBirimi | "";
  /** true → yenilemesi yaklaşan / süresi geçmiş, yenilenmemiş abonelikler. */
  Yenileme: boolean;
};

export const BOS_SATIS_FILTRELERI: SatisFiltreleri = {
  Durum: "",
  SatisTipi: "",
  OdemeDurumu: "",
  ParaBirimi: "",
  Yenileme: false,
};

type FormValues = { Durum: string; SatisTipi: string; OdemeDurumu: string; ParaBirimi: string };

const TUMU = { value: "ALL", label: "Tümü" };

const DURUM_OPTIONS = [
  TUMU,
  ...([0, 1] as const).map((d) => ({ value: String(d), label: SATIS_DURUM[d].label })),
];
const TIP_OPTIONS = [TUMU, ...SATIS_TIPI_SECENEKLERI];
const ODEME_OPTIONS = [TUMU, ...ODEME_DURUM_SECENEKLERI];
const PARA_OPTIONS = [TUMU, ...PARA_BIRIMI_DATA.map((p) => ({ value: p.value, label: p.value }))];

const bosaCevir = (v: string | undefined) => (!v || v === "ALL" ? "" : v);

const formaCevir = (f: SatisFiltreleri): FormValues => ({
  Durum: f.Durum || "ALL",
  SatisTipi: f.SatisTipi || "ALL",
  OdemeDurumu: f.OdemeDurumu || "ALL",
  ParaBirimi: f.ParaBirimi || "ALL",
});

type Props = {
  filters: SatisFiltreleri;
  onChange: (next: SatisFiltreleri) => void;
  onReset: () => void;
};

export function SatisFiltre({ filters, onChange, onReset }: Props) {
  const initialFormValues = useMemo(() => formaCevir(filters), [filters]);
  const form = useForm<FormValues>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  // Yenileme filtresi popover'da değil, uyarı bandından açılır; burada korunur.
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values, name }) => {
          if (!name) return;
          onChange({
            Durum: bosaCevir(values.Durum) as SatisFiltreleri["Durum"],
            SatisTipi: bosaCevir(values.SatisTipi) as SatisFiltreleri["SatisTipi"],
            OdemeDurumu: bosaCevir(values.OdemeDurumu) as SatisFiltreleri["OdemeDurumu"],
            ParaBirimi: bosaCevir(values.ParaBirimi) as SatisFiltreleri["ParaBirimi"],
            Yenileme: filters.Yenileme,
          });
        },
      }),
    [form, onChange, filters.Yenileme],
  );

  const handleReset = () => {
    form.reset(formaCevir(BOS_SATIS_FILTRELERI));
    onReset();
  };

  const activeCount = [
    filters.Durum,
    filters.SatisTipi,
    filters.OdemeDurumu,
    filters.ParaBirimi,
    filters.Yenileme,
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
        <p className="text-sm font-semibold text-foreground">Satış Filtrele</p>

        <div className="space-y-3">
          <FormSelect control={form.control} name="Durum" label="Durum" options={DURUM_OPTIONS} />
          <FormSelect control={form.control} name="SatisTipi" label="Satış Tipi" options={TIP_OPTIONS} />
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
