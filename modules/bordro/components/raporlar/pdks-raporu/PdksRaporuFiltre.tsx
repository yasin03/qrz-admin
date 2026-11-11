"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { format, parse } from "date-fns";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import { CustomDatePicker } from "@/components/customs/CustomDatePicker";
import { useAktifPersonelListesi } from "@/modules/bordro/hooks/use-personel";
import { PdksRaporFilters, PdksRaporIslem } from "@/modules/bordro/types/rapor";

type FormValues = {
  tarihAraligi: DateRange | undefined;
  IDBolum: string;
  IDSubePersonel: string;
  Islem: string;
};

type Props = {
  filters: PdksRaporFilters;
  bolumler: { IDBolum: string; BolumAdi: string }[];
  onChange: (next: PdksRaporFilters) => void;
  onReset: () => void;
};

// Select boş string değer kabul etmediği için "Tümü" ALL ile tutuluyor,
// API'ye "" olarak gidiyor.
const ISLEM_TUMU = "ALL";

export const ISLEM_OPTIONS: { value: string; label: string }[] = [
  { value: ISLEM_TUMU, label: "Tümü" },
  { value: "GEÇGİRİŞ", label: "Geç Giriş Yapanlar" },
  { value: "GEÇÇIKIŞ", label: "Geç Çıkış Yapanlar" },
  { value: "MESAİ", label: "Mesai Yapanlar" },
  { value: "DEVAMSIZ", label: "Devamsızlık Yapanlar" },
];

const toFormValues = (filters: PdksRaporFilters): FormValues => ({
  tarihAraligi: {
    from: filters.Tarih1
      ? parse(filters.Tarih1, "yyyy-MM-dd", new Date())
      : undefined,
    to: filters.Tarih2
      ? parse(filters.Tarih2, "yyyy-MM-dd", new Date())
      : undefined,
  },
  IDBolum: String(filters.IDBolum || "0"),
  IDSubePersonel: String(filters.IDSubePersonel || "0"),
  Islem: filters.Islem || ISLEM_TUMU,
});

const PdksRaporuFiltre = ({ filters, bolumler, onChange, onReset }: Props) => {
  const { data: personelListesi = [] } = useAktifPersonelListesi();

  const form = useForm<FormValues>({ defaultValues: toFormValues(filters) });

  useEffect(() => {
    form.reset(toFormValues(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name) return;

      const range = values.tarihAraligi;
      if (!range?.from || !range?.to) return;

      onChange({
        Tarih1: format(range.from, "yyyy-MM-dd"),
        Tarih2: format(range.to, "yyyy-MM-dd"),
        IDBolum: values.IDBolum || "0",
        IDSubePersonel: values.IDSubePersonel || "0",
        Islem: (values.Islem === ISLEM_TUMU
          ? ""
          : values.Islem) as PdksRaporIslem,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const bolumOptions = useMemo(
    () => [{ IDBolum: "0", BolumAdi: "Tümü" }, ...bolumler],
    [bolumler],
  );

  const personelOptions = useMemo(
    () => [
      { value: "0", label: "Tümü" },
      ...personelListesi.map((p) => ({
        value: String(p.IDSubePersonel),
        label: String(p.AdSoyad ?? "").trim(),
      })),
    ],
    [personelListesi],
  );

  // Popover kapalıyken de aktif filtre sayısı butonda görünsün
  const [idBolum, idSubePersonel, islem] = useWatch({
    control: form.control,
    name: ["IDBolum", "IDSubePersonel", "Islem"],
  });
  const aktifFiltreSayisi =
    Number(Boolean(idBolum) && idBolum !== "0") +
    Number(Boolean(idSubePersonel) && idSubePersonel !== "0") +
    Number(Boolean(islem) && islem !== ISLEM_TUMU);

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
          {aktifFiltreSayisi > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {aktifFiltreSayisi}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="min-w-96 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          PDKS Raporu Filtrele
        </p>

        <div className="space-y-3">
          <CustomDatePicker
            control={form.control}
            name="tarihAraligi"
            label="Tarih Aralığı"
            mode="range"
          />

          <FormSelect
            control={form.control}
            name="Islem"
            label="İşlem"
            options={ISLEM_OPTIONS}
            valueKey="value"
            labelKey="label"
          />

          <FormSelect
            control={form.control}
            name="IDBolum"
            label="Bölüm"
            options={bolumOptions}
            valueKey="IDBolum"
            labelKey="BolumAdi"
          />

          <FormSelect
            control={form.control}
            name="IDSubePersonel"
            label="Personel"
            options={personelOptions}
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
            onClick={onReset}
          >
            Sıfırla
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PdksRaporuFiltre;
