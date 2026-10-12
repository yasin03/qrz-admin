"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { FormSelect, FormSwitch } from "../forms";
import { useCurrentContext } from "@/hooks/use-context";
import { useBolumler } from "@/hooks/use-kurumsal-data";
import { PDKSSelectRequestType } from "@/types/pdks";

type FormValues = {
  IDSube: string;
  IDBolum: string;
  GirisYok: boolean;
  CikisYok: boolean;
};

// Tarih filtre dışında (CustomDateNavigator) yönetiliyor.
// GirisYok/CikisYok API'ye gitmez, gelen liste client tarafında süzülür.
export type PdksFiltreValues = Pick<
  PDKSSelectRequestType,
  "IDSube" | "IDBolum"
> & {
  GirisYok: boolean;
  CikisYok: boolean;
};

type Props = {
  onApply: (filters: PdksFiltreValues) => void;
};

export default function PdksFiltre({ onApply }: Props) {
  const { data: context } = useCurrentContext();

  const form = useForm<FormValues>({
    defaultValues: {
      IDSube: "",
      IDBolum: "0",
      GirisYok: false,
      CikisYok: false,
    },
  });

  const { data: bolumlerData = [] } = useBolumler(Number(context?.IDSube) || 0);

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

  const buildFilters = useCallback((values: FormValues): PdksFiltreValues => {
    const bolumSeciliMi = Boolean(values.IDBolum) && values.IDBolum !== "0";

    return {
      IDSube: bolumSeciliMi ? "0" : values.IDSube || "0",
      IDBolum: bolumSeciliMi ? values.IDBolum : "0",
      GirisYok: Boolean(values.GirisYok),
      CikisYok: Boolean(values.CikisYok),
    };
  }, []);

  // Context yüklendiğinde IDSube'u forma set et (kullanıcı bunu göremez/değiştiremez)
  // ve ilk filtreyi doğrudan uygula. Context cache'den hazır geldiğinde bu efekt
  // watch aboneliğinden önce çalıştığı için değişiklik watch'a hiç ulaşmıyor.
  useEffect(() => {
    if (context?.IDSube && !form.getValues("IDSube")) {
      form.setValue("IDSube", String(context.IDSube));
      onApply(buildFilters(form.getValues()));
    }
  }, [context, form, onApply, buildFilters]);

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
      GirisYok: false,
      CikisYok: false,
    });
  };

  // Popover kapalıyken de aktif filtre sayısı butonda görünsün
  const [idBolum, girisYok, cikisYok] = useWatch({
    control: form.control,
    name: ["IDBolum", "GirisYok", "CikisYok"],
  });
  const aktifFiltreSayisi =
    Number(Boolean(idBolum) && idBolum !== "0") +
    Number(Boolean(girisYok)) +
    Number(Boolean(cikisYok));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" color="secondary" appearance="outline" size="sm">
          <Filter className="size-4" />
          Filtre
          {aktifFiltreSayisi > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {aktifFiltreSayisi}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-100 space-y-4">
        <p className="text-sm font-semibold text-foreground">PDKS Filtrele</p>

        <div className="space-y-3">
          <FormSelect
            control={form.control}
            name="IDBolum"
            label="Bölüm"
            options={bolumler}
            valueKey="IDBolum"
            labelKey="BolumAdi"
          />

          <FormSwitch control={form.control} name="GirisYok" label="Giriş" />
          <FormSwitch control={form.control} name="CikisYok" label="Çıkış" />
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
