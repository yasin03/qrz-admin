"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { FormSelect, FormInput } from "../forms";
import { useCurrentContext } from "@/hooks/use-context";
import { useBolumler } from "@/hooks/use-kurumsal-data";
import { PDKSSelectRequestType } from "@/types/pdks";

type FormValues = {
  IDSube: string;
  IDBolum: string;
  Tarih1: string;
  Tarih2: string;
};

type Props = {
  onApply: (filters: PDKSSelectRequestType) => void;
};

const BUGUN = format(new Date(), "yyyy-MM-dd");

export default function PdksFiltre({ onApply }: Props) {
  const { data: context } = useCurrentContext();

  const form = useForm<FormValues>({
    defaultValues: {
      IDSube: "",
      IDBolum: "0",
      Tarih1: BUGUN,
      Tarih2: BUGUN,
    },
  });

  const { data: bolumlerData = [] } = useBolumler(
    Number(context?.IDSube) || 0,
  );

  const bolumler = useMemo(
    () => [
      { IDBolum: "0", BolumAdi: "Tümü" },
      ...bolumlerData.map((b) => ({
        IDBolum: String(b.IDBolum),
        BolumAdi: b.BolumAdi,
      })),
    ],
    [bolumlerData],
  );

  // Context yüklendiğinde IDSube'u forma set et (kullanıcı bunu göremez/değiştiremez)
  useEffect(() => {
    if (context?.IDSube && !form.getValues("IDSube")) {
      form.setValue("IDSube", String(context.IDSube));
    }
  }, [context, form]);

  const buildFilters = useCallback(
    (values: FormValues): PDKSSelectRequestType => {
      const bolumSeciliMi = Boolean(values.IDBolum) && values.IDBolum !== "0";

      return {
        IDSube: bolumSeciliMi ? "0" : values.IDSube || "0",
        IDBolum: bolumSeciliMi ? values.IDBolum : "0",
        Tarih1: values.Tarih1,
        Tarih2: values.Tarih2,
      };
    },
    [],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = form.watch((values) => {
      // Context henüz IDSube'u set etmediyse bekle, boş filtre atmayalım
      if (!values.IDSube) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onApply(buildFilters(values as FormValues));
      }, 250);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, buildFilters, onApply]);

  const handleReset = () => {
    form.reset({
      IDSube: context?.IDSube ? String(context.IDSube) : "",
      IDBolum: "0",
      Tarih1: BUGUN,
      Tarih2: BUGUN,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" size="sm">
          <Filter className="size-4" />
          Filtre
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-100 space-y-4">
        <p className="text-sm font-semibold text-foreground">
          PDKS Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="IDBolum"
            label="Bölüm"
            options={bolumler}
            valueKey="IDBolum"
            labelKey="BolumAdi"
          />

          <FormInput
            control={form.control}
            name="Tarih1"
            label="Başlangıç Tarihi"
            type="date"
          />
          <FormInput
            control={form.control}
            name="Tarih2"
            label="Bitiş Tarihi"
            type="date"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            color="secondary"
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
}