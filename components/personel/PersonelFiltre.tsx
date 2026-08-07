"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { FormSelect, FormInput } from "../forms";
import { useCurrentContext } from "@/hooks/use-context";
import { useSubeler, useBolumler } from "@/hooks/use-kurumsal-data";
import { type PersonelFilters } from "@/hooks/use-personel";

const DURUM_OPTIONS = [
  { label: "Tümü", value: "TÜMÜ" },
  { label: "İlgili tarih itibari ile AKTİF olanlar", value: "AKTİF" },
  { label: "İlgili tarih itibari ile PASİF olanlar", value: "PASİF" },
  { label: "Yeni Eklenenler", value: "YENİ" },
];

type FormValues = {
  IDSube: string | number;
  IDBolum: string | number;
  Durum: string;
  DurumTarihi: string;
};

type Props = {
  onApply: (filters: PersonelFilters) => void;
};

export default function PersonelFiltre({ onApply }: Props) {
  const { data: context } = useCurrentContext();

  const { data: subeler = [] } = useSubeler(Number(context?.IDSirket) || 0);

  const form = useForm<FormValues>({
    defaultValues: {
      IDSube: "",
      IDBolum: "",
      Durum: "TÜMÜ",
      DurumTarihi: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const selectedSube = form.watch("IDSube");
  const { data: bolumler = [] } = useBolumler(Number(selectedSube) || 0);

  // Context'teki (üstten seçilen) şubeyi filtreye varsayılan olarak koy —
  // kullanıcı sonradan farklı bir şube seçebilir, bu sadece ilk açılış.
  useEffect(() => {
    if (context?.IDSube && !form.getValues("IDSube")) {
      form.setValue("IDSube", context.IDSube);
    }
  }, [context, form]);

  // Şube değişince eski bölüm seçili kalmasın.
  useEffect(() => {
    form.setValue("IDBolum", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSube]);

  const handleApply = (values: FormValues) => {
    const tumu = values.Durum === "TÜMÜ";
    console.log("FORM VALUES:", values);
    const filters = {
      IDSube: values.IDSube,
      IDBolum: values.IDBolum,
      Durum: tumu ? "" : (values.Durum as PersonelFilters["Durum"]),
      DurumTarihi: tumu ? "" : values.DurumTarihi,
    };

    console.log("GÖNDERİLEN FİLTRE:", filters);

    onApply(filters);
  };

  const handleReset = () => {
    form.reset({
      IDSube: context?.IDSube ?? "",
      IDBolum: "",
      Durum: "TÜMÜ",
      DurumTarihi: format(new Date(), "yyyy-MM-dd"),
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
          Personel Filtrele
        </p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="IDSube"
            label="Şube"
            options={subeler}
            valueKey="IDSube"
            labelKey="SubeAdi"
          />
          <FormSelect
            control={form.control}
            name="IDBolum"
            label="Bölüm"
            options={bolumler}
            valueKey="IDBolum"
            labelKey="BolumAdi"
            disabled={!selectedSube}
            placeholder={!selectedSube ? "Önce şube seçin" : "Tümü"}
          />
          <FormSelect
            control={form.control}
            name="Durum"
            label="Durum"
            options={DURUM_OPTIONS}
          />
          <FormInput
            control={form.control}
            name="DurumTarihi"
            label="Durum Tarihi"
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
          <Button
            type="button"
            size="sm"
            onClick={form.handleSubmit(handleApply)}
          >
            Uygula
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
