"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormLabel, FormSelect } from "@/components/forms";
import { AY_DATA } from "@/constants/data";

import {
  useInsertKidemIhbar,
  useUpdateKidemIhbar,
} from "@/modules/core/hooks/sistem/use-sgk-bordro";
import {
  KidemIhbarInsertRequestType,
  KidemIhbarType,
} from "@/modules/core/types/sistem/sgk-bordro";
import { useYilOptions } from "@/modules/core/components/sistem/sgk-bordro-parametreleri/YilSecici";
import { toAyValue } from "@/modules/core/components/sistem/sgk-bordro-parametreleri/katsayi-oranlari/katsayi-oran-options";
import { TIP_OPTIONS, toTipValue } from "./kidem-ihbar-options";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Yeni kayıtta varsayılan yıl (listede seçili yıl) */
  defaultYil: string;
  /** Verilirse dialog düzenleme modunda açılır */
  kidemIhbar?: KidemIhbarType | null;
};

const gunSchema = (label: string) =>
  z
    .string()
    .min(1, `${label} giriniz`)
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
      `${label} pozitif tam sayı olmalı`,
    );

// Maksimum değer money input'tan "12000.50" gibi düz ondalık string olarak gelir.
const kidemIhbarSchema = z
  .object({
    yil: z.string().min(1, "Yıl seçiniz"),
    tip: z.enum(["İhbar", "Kıdem"], { message: "Tip seçiniz" }),
    aciklama: z.string().trim().min(1, "Açıklama giriniz"),
    baslangicGun: gunSchema("Başlangıç günü"),
    bitisGun: gunSchema("Bitiş günü"),
    hesaplanacakGun: gunSchema("Hesaplanacak gün"),
    maksimumDeger: z.string().min(1, "Maksimum değer giriniz"),
    baslangicAy: z.string().min(1, "Başlangıç ayını seçiniz"),
    bitisAy: z.string().min(1, "Bitiş ayını seçiniz"),
  })
  .refine((v) => Number(v.bitisGun) >= Number(v.baslangicGun), {
    path: ["bitisGun"],
    message: "Bitiş günü, başlangıç gününden küçük olamaz",
  });

type KidemIhbarForm = z.infer<typeof kidemIhbarSchema>;

const getDefaultValues = (yil: string): KidemIhbarForm => ({
  yil,
  tip: "İhbar",
  aciklama: "",
  baslangicGun: "",
  bitisGun: "",
  hesaplanacakGun: "",
  maksimumDeger: "0",
  baslangicAy: "01",
  bitisAy: "12",
});

function toFormValues(kidemIhbar: KidemIhbarType): KidemIhbarForm {
  return {
    yil: String(kidemIhbar.Yil ?? ""),
    tip: toTipValue(kidemIhbar.Tip),
    aciklama: kidemIhbar.Aciklama ?? "",
    baslangicGun: String(kidemIhbar.BaslangicGun ?? ""),
    bitisGun: String(kidemIhbar.BitisGun ?? ""),
    hesaplanacakGun: String(kidemIhbar.HesaplanacakGun ?? ""),
    maksimumDeger: String(kidemIhbar.MaksimumDeger ?? "0"),
    baslangicAy: toAyValue(kidemIhbar.BaslangicAy),
    bitisAy: toAyValue(kidemIhbar.BitisAy),
  };
}

function toRequest(values: KidemIhbarForm): KidemIhbarInsertRequestType {
  return {
    Yil: Number(values.yil),
    Aciklama: values.aciklama.trim(),
    BaslangicGun: Number(values.baslangicGun),
    BitisGun: Number(values.bitisGun),
    HesaplanacakGun: Number(values.hesaplanacakGun),
    Tip: values.tip,
    MaksimumDeger: Number(values.maksimumDeger),
    BaslangicAy: values.baslangicAy,
    BitisAy: values.bitisAy,
  };
}

const KidemIhbarEkle = ({
  open,
  onOpenChange,
  defaultYil,
  kidemIhbar,
}: Props) => {
  const isEdit = Boolean(kidemIhbar);
  const { mutateAsync: insertKidemIhbar, isPending: isInserting } =
    useInsertKidemIhbar();
  const { mutateAsync: updateKidemIhbar, isPending: isUpdating } =
    useUpdateKidemIhbar();
  const isSaving = isInserting || isUpdating;

  const yilOptions = useYilOptions(defaultYil, String(kidemIhbar?.Yil ?? ""));

  const form = useForm<KidemIhbarForm>({
    resolver: zodResolver(kidemIhbarSchema),
    defaultValues: kidemIhbar
      ? toFormValues(kidemIhbar)
      : getDefaultValues(defaultYil),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues(defaultYil));
    } else if (kidemIhbar) {
      form.reset(toFormValues(kidemIhbar));
    }
  }, [open, kidemIhbar, defaultYil, form]);

  const handleSubmit = async (values: KidemIhbarForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = kidemIhbar
        ? await updateKidemIhbar({
            IDPersonelKidemSure: kidemIhbar.IDPersonelKidemSure,
            ...toRequest(values),
          })
        : await insertKidemIhbar(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`Kıdem ihbar tanımı ${islem}.`);
        return;
      }

      toast.success(
        isEdit
          ? "Kıdem ihbar tanımı başarıyla güncellendi."
          : "Kıdem ihbar tanımı başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Kıdem ihbar tanımı ${islem}.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Kıdem İhbar Tanımı Düzenle"
              : "Yeni Kıdem İhbar Tanımı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Kıdem/ihbar süre tanımını güncelleyin."
              : "Çalışma süresi aralığı ve hesaplanacak gün sayısını tanımlayın."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormSelect
              control={form.control}
              name="yil"
              label="Yıl"
              options={yilOptions}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormSelect
              control={form.control}
              name="tip"
              label="Tip"
              options={TIP_OPTIONS}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="aciklama"
              label="Açıklama"
              placeholder="6 aydan az olan..."
              disabled={isSaving}
            />
            <FormLabel label="Başlangıç / Bitiş / Hesaplanacak Gün">
              <FormInput
                control={form.control}
                name="baslangicGun"
                format="number"
                placeholder="0"
                disabled={isSaving}
              />

              <FormInput
                control={form.control}
                name="bitisGun"
                format="number"
                placeholder="0"
                disabled={isSaving}
              />
            <FormInput
              control={form.control}
              name="hesaplanacakGun"
              format="number"
              placeholder="0"
              disabled={isSaving}
            />
            </FormLabel>


            <FormLabel label="Başlangıç / Bitiş Ay">
              <FormSelect
                control={form.control}
                name="baslangicAy"
                options={AY_DATA}
                valueKey="value"
                labelKey="label"
                disabled={isSaving}
              />

              <FormSelect
                control={form.control}
                name="bitisAy"
                options={AY_DATA}
                valueKey="value"
                labelKey="label"
                disabled={isSaving}
              />
            </FormLabel>

            <FormInput
              control={form.control}
              name="maksimumDeger"
              label="Maksimum Değer"
              format="money"
              placeholder="0,00"
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              appearance="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default KidemIhbarEkle;
