"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";

import { FormSelect } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIller } from "@/modules/core/hooks/use-il-ilce-vergi-data";
import { KISI_TURU_SECENEKLERI } from "@/modules/crm/lib/crm";
import type { CrmKisiTuru } from "@/modules/crm/types/crm";

export type KisiRandevuFiltre = "bekleyen" | "gecikmis" | "yok";

/** Boş değer ("" / null) → o alana göre filtrelenmez. */
export type KisiFiltreleri = {
  Durum: boolean | null;
  KisiTuru: CrmKisiTuru | null;
  IlKodu: string;
  Randevu: KisiRandevuFiltre | "";
};

export const BOS_KISI_FILTRELERI: KisiFiltreleri = {
  Durum: null,
  KisiTuru: null,
  IlKodu: "",
  Randevu: "",
};

type FormValues = {
  Durum: "ALL" | "true" | "false";
  KisiTuru: "ALL" | `${CrmKisiTuru}`;
  IlKodu: string;
  Randevu: "ALL" | KisiRandevuFiltre;
};

const TUMU = { value: "ALL", label: "Tümü" };

const DURUM_OPTIONS = [TUMU, { value: "true", label: "Aktif" }, { value: "false", label: "Pasif" }];
const KISI_TURU_OPTIONS = [TUMU, ...KISI_TURU_SECENEKLERI];
const RANDEVU_OPTIONS = [
  TUMU,
  { value: "bekleyen", label: "Bekleyen randevusu olan" },
  { value: "gecikmis", label: "Randevusu gecikmiş" },
  { value: "yok", label: "Bekleyen randevusu olmayan" },
];

const formaCevir = (f: KisiFiltreleri): FormValues => ({
  Durum: f.Durum === null ? "ALL" : f.Durum ? "true" : "false",
  KisiTuru: f.KisiTuru === null ? "ALL" : (String(f.KisiTuru) as `${CrmKisiTuru}`),
  IlKodu: f.IlKodu || "ALL",
  Randevu: f.Randevu || "ALL",
});

const formdanCevir = (v: Partial<FormValues>): KisiFiltreleri => ({
  Durum: !v.Durum || v.Durum === "ALL" ? null : v.Durum === "true",
  KisiTuru: !v.KisiTuru || v.KisiTuru === "ALL" ? null : (Number(v.KisiTuru) as CrmKisiTuru),
  IlKodu: !v.IlKodu || v.IlKodu === "ALL" ? "" : v.IlKodu,
  Randevu: !v.Randevu || v.Randevu === "ALL" ? "" : v.Randevu,
});

type Props = {
  filters: KisiFiltreleri;
  baslik: string;
  onChange: (next: KisiFiltreleri) => void;
  onReset: () => void;
};

export function KisiFiltre({ filters, baslik, onChange, onReset }: Props) {
  const { data: iller = [], isLoading: illerYukleniyor } = useIller();
  const ilOptions = useMemo(
    () => [{ value: "ALL", label: "Tümü" }, ...iller.map((il) => ({ value: il.IlKodu, label: il.IlAdi }))],
    [iller],
  );

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
    form.reset(formaCevir(BOS_KISI_FILTRELERI));
    onReset();
  };

  const activeCount = [filters.Durum !== null, filters.KisiTuru !== null, filters.IlKodu, filters.Randevu].filter(
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
        <p className="text-sm font-semibold text-foreground">{baslik} Filtrele</p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="Durum"
            label="Durum"
            options={DURUM_OPTIONS}
            valueKey="value"
            labelKey="label"
          />
          <FormSelect
            control={form.control}
            name="KisiTuru"
            label="Kişi Türü"
            options={KISI_TURU_OPTIONS}
            valueKey="value"
            labelKey="label"
          />
          <FormSelect
            control={form.control}
            name="IlKodu"
            label="Şehir"
            disabled={illerYukleniyor}
            options={ilOptions}
            valueKey="value"
            labelKey="label"
          />
          <FormSelect
            control={form.control}
            name="Randevu"
            label="Randevu"
            options={RANDEVU_OPTIONS}
            valueKey="value"
            labelKey="label"
          />
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
