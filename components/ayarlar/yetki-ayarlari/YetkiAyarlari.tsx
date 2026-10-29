"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { FormSubmitButton, FormSwitch } from "@/components/forms";
import { usePerYetki, useUpdatePerYetki } from "@/hooks/use-per-yetki";
import { PerYetkiUpdateRequestType } from "@/types/ayarlar/per-yetki";

const DEFAULT_VALUES: PerYetkiUpdateRequestType = {
  PersonelPdksGorur: false,
  PersonelPuantajGorur: false,
  PersonelBordroGorur: false,
  PersonelHerLokasyonuKullanabilir: false,
};

const YETKILER: {
  name: keyof PerYetkiUpdateRequestType;
  label: string;
  description: string;
}[] = [
  {
    name: "PersonelPdksGorur",
    label: "PDKS",
    description: "Personel kendi PDKS kayıtlarını görebilir.",
  },
  {
    name: "PersonelPuantajGorur",
    label: "Puantaj",
    description: "Personel kendi puantajını görebilir.",
  },
  {
    name: "PersonelBordroGorur",
    label: "Bordro",
    description: "Personel kendi bordrosunu görebilir.",
  },
  {
    name: "PersonelHerLokasyonuKullanabilir",
    label: "Tüm Lokasyonlar",
    description: "Personel her lokasyondan giriş/çıkış yapabilir.",
  },
];

const YetkiAyarlari = () => {
  const { data: perYetki, isLoading, isError } = usePerYetki();
  const { mutateAsync: updatePerYetki, isPending } = useUpdatePerYetki();

  const form = useForm<PerYetkiUpdateRequestType>({
    defaultValues: DEFAULT_VALUES,
  });

  // Veri gelince formu doldur.
  useEffect(() => {
    if (!perYetki) return;

    form.reset({
      PersonelPdksGorur: Boolean(perYetki.PersonelPdksGorur),
      PersonelPuantajGorur: Boolean(perYetki.PersonelPuantajGorur),
      PersonelBordroGorur: Boolean(perYetki.PersonelBordroGorur),
      PersonelHerLokasyonuKullanabilir: Boolean(
        perYetki.PersonelHerLokasyonuKullanabilir,
      ),
    });
  }, [perYetki, form]);

  const onSubmit = async (values: PerYetkiUpdateRequestType) => {
    try {
      const result = await updatePerYetki(values);
      if (Number(result?.test) !== 1) {
        toast.error("Yetki ayarları kaydedilemedi.");
        return;
      }
      toast.success("Yetki ayarları kaydedildi.");
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ||
          "Yetki ayarları kaydedilemedi.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Yetki Ayarları</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2" />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Yetki ayarları yüklenemedi.
        </p>
      ) : (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 rounded-xl border border-border bg-card p-5"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Personel Yetkileri
            </h2>
            <p className="text-sm text-muted-foreground">
              Personelin mobil uygulamada görebileceği ve kullanabileceği
              alanlar.
            </p>
          </div>

          <div className="divide-y divide-border">
            {YETKILER.map((yetki) => (
              <div
                key={yetki.name}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{yetki.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {yetki.description}
                  </p>
                </div>
                <FormSwitch
                  control={form.control}
                  name={yetki.name}
                  className="w-auto shrink-0 p-0 *:w-auto"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <FormSubmitButton loading={isPending}>
              <Save className="size-4" />
              Kaydet
            </FormSubmitButton>
          </div>
        </form>
      )}
    </div>
  );
};

export default YetkiAyarlari;
