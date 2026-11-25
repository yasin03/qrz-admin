"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PARA_BIRIMI_DATA } from "@/constants/data";
import { TEKLIF_DURUM } from "@/modules/crm/lib/teklif";
import type { TeklifParaBirimi } from "@/modules/crm/types/teklif";

/** Durum: "0".."4" ya da "SURESI_DOLDU" (gönderilmiş + geçerliliği geçmiş). */
export type TeklifDurumFiltre = "" | "0" | "1" | "2" | "3" | "4" | "SURESI_DOLDU";

/** Boş değer → o alana göre filtrelenmez. */
export type TeklifFiltreleri = {
  Durum: TeklifDurumFiltre;
  ParaBirimi: TeklifParaBirimi | "";
  KisiTip: "Kontak" | "Musteri" | "";
};

export const BOS_TEKLIF_FILTRELERI: TeklifFiltreleri = { Durum: "", ParaBirimi: "", KisiTip: "" };

type FormValues = { Durum: string; ParaBirimi: string; KisiTip: string };

const TUMU = { value: "ALL", label: "Tümü" };

const DURUM_OPTIONS = [
  TUMU,
  ...([0, 1] as const).map((d) => ({ value: String(d), label: TEKLIF_DURUM[d].label })),
  { value: "SURESI_DOLDU", label: "Süresi doldu" },
  ...([2, 3, 4] as const).map((d) => ({ value: String(d), label: TEKLIF_DURUM[d].label })),
];
const PARA_OPTIONS = [TUMU, ...PARA_BIRIMI_DATA.map((p) => ({ value: p.value, label: p.value }))];
const KISI_OPTIONS = [TUMU, { value: "Musteri", label: "Müşteri" }, { value: "Kontak", label: "Kontak" }];

const formaCevir = (f: TeklifFiltreleri): FormValues => ({
  Durum: f.Durum || "ALL",
  ParaBirimi: f.ParaBirimi || "ALL",
  KisiTip: f.KisiTip || "ALL",
});

const formdanCevir = (v: Partial<FormValues>): TeklifFiltreleri => ({
  Durum: (!v.Durum || v.Durum === "ALL" ? "" : v.Durum) as TeklifDurumFiltre,
  ParaBirimi: (!v.ParaBirimi || v.ParaBirimi === "ALL" ? "" : v.ParaBirimi) as TeklifFiltreleri["ParaBirimi"],
  KisiTip: (!v.KisiTip || v.KisiTip === "ALL" ? "" : v.KisiTip) as TeklifFiltreleri["KisiTip"],
});

type Props = {
  filters: TeklifFiltreleri;
  onChange: (next: TeklifFiltreleri) => void;
  onReset: () => void;
};

export function TeklifFiltre({ filters, onChange, onReset }: Props) {
  const initialFormValues = useMemo(() => formaCevir(filters), [filters]);
  const form = useForm<FormValues>({ defaultValues: initialFormValues });

  useEffect(() => {
    form.reset(initialFormValues);
  }, [form, initialFormValues]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;
      onChange(formdanCevir(values));
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleReset = () => {
    form.reset(formaCevir(BOS_TEKLIF_FILTRELERI));
    onReset();
  };

  const activeCount = [filters.Durum, filters.ParaBirimi, filters.KisiTip].filter(Boolean).length;

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
        <p className="text-sm font-semibold text-foreground">Teklif Filtrele</p>

        <div className="space-y-3">
          <FormSelect control={form.control} name="Durum" label="Durum" options={DURUM_OPTIONS} />
          <FormSelect control={form.control} name="ParaBirimi" label="Para Birimi" options={PARA_OPTIONS} />
          <FormSelect control={form.control} name="KisiTip" label="Kişi" options={KISI_OPTIONS} />
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
