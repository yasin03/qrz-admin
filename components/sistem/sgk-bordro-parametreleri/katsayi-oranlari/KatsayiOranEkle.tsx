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
import { FormInput, FormSelect } from "@/components/forms";
import { AY_DATA } from "@/constants/data";

import {
  useInsertKatsayiOran,
  useUpdateKatsayiOran,
} from "@/hooks/sistem/use-sgk-bordro";
import {
  KatsayiOranInsertRequestType,
  KatsayiOranType,
} from "@/types/sistem/sgk-bordro";
import { useYilOptions } from "../YilSecici";
import { KATSAYI_ALANLARI, toAyValue } from "./katsayi-oran-options";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Yeni kayıtta varsayılan yıl (listede seçili yıl) */
  defaultYil: string;
  /** Seçili yılda kaydı olan aylar — yeni kayıtta ilk boş ay önerilir */
  mevcutAylar: string[];
  /** Verilirse dialog düzenleme modunda açılır */
  katsayiOran?: KatsayiOranType | null;
};

// Tutarlar money input'tan "33030.00", oranlar decimal input'tan "0.00759"
// gibi düz ondalık string olarak gelir.
const deger = (label: string) =>
  z
    .string()
    .min(1, `${label} giriniz`)
    .refine((v) => Number(v) >= 0, `${label} negatif olamaz`);

const labelOf = (key: (typeof KATSAYI_ALANLARI)[number]["key"]) =>
  KATSAYI_ALANLARI.find((a) => a.key === key)!.label;

const katsayiOranSchema = z.object({
  Yil: z.string().min(1, "Yıl seçiniz"),
  Ay: z.string().min(1, "Ay seçiniz"),
  DamgaVergisi: deger(labelOf("DamgaVergisi")),
  SskGunlukTaban: deger(labelOf("SskGunlukTaban")),
  SskGunlukTavan: deger(labelOf("SskGunlukTavan")),
  SskAylikTaban: deger(labelOf("SskAylikTaban")),
  SskAylikTavan: deger(labelOf("SskAylikTavan")),
  DamgaVergisiIstisnasi: deger(labelOf("DamgaVergisiIstisnasi")),
  AuGelirVergisiMatrahi: deger(labelOf("AuGelirVergisiMatrahi")),
  GelirVergisiIstisnasi: deger(labelOf("GelirVergisiIstisnasi")),
  SgkIssizIsverenPrimiOran: deger(labelOf("SgkIssizIsverenPrimiOran")).refine(
    (v) => Number(v) <= 100,
    "Oran 100'den büyük olamaz",
  ),
  EmekliNet: deger(labelOf("EmekliNet")),
});

type KatsayiOranForm = z.infer<typeof katsayiOranSchema>;

const BOS_DEGERLER = Object.fromEntries(
  KATSAYI_ALANLARI.map((a) => [a.key, ""]),
) as Omit<KatsayiOranForm, "Yil" | "Ay">;

const getDefaultValues = (yil: string, ay: string): KatsayiOranForm => ({
  Yil: yil,
  Ay: ay,
  ...BOS_DEGERLER,
});

function toFormValues(katsayiOran: KatsayiOranType): KatsayiOranForm {
  return {
    Yil: String(katsayiOran.Yil ?? ""),
    Ay: toAyValue(katsayiOran.Ay),
    ...(Object.fromEntries(
      KATSAYI_ALANLARI.map((a) => [a.key, String(katsayiOran[a.key] ?? "")]),
    ) as Omit<KatsayiOranForm, "Yil" | "Ay">),
  };
}

function toRequest(values: KatsayiOranForm): KatsayiOranInsertRequestType {
  return {
    Yil: Number(values.Yil),
    Ay: values.Ay,
    ...(Object.fromEntries(
      KATSAYI_ALANLARI.map((a) => [a.key, Number(values[a.key])]),
    ) as Omit<KatsayiOranInsertRequestType, "Yil" | "Ay">),
  };
}

const KatsayiOranEkle = ({
  open,
  onOpenChange,
  defaultYil,
  mevcutAylar,
  katsayiOran,
}: Props) => {
  const isEdit = Boolean(katsayiOran);
  const { mutateAsync: insertKatsayiOran, isPending: isInserting } =
    useInsertKatsayiOran();
  const { mutateAsync: updateKatsayiOran, isPending: isUpdating } =
    useUpdateKatsayiOran();
  const isSaving = isInserting || isUpdating;

  const yilOptions = useYilOptions(
    defaultYil,
    String(katsayiOran?.Yil ?? ""),
  );

  // Yeni kayıtta o yıl için henüz girilmemiş ilk ay önerilir.
  const onerilenAy =
    AY_DATA.find((ay) => !mevcutAylar.includes(ay.value))?.value ?? "01";

  const form = useForm<KatsayiOranForm>({
    resolver: zodResolver(katsayiOranSchema),
    defaultValues: katsayiOran
      ? toFormValues(katsayiOran)
      : getDefaultValues(defaultYil, onerilenAy),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues(defaultYil, onerilenAy));
    } else if (katsayiOran) {
      form.reset(toFormValues(katsayiOran));
    }
    // onerilenAy liste her güncellendiğinde değişir; açık formu sıfırlamasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, katsayiOran, defaultYil, form]);

  const handleSubmit = async (values: KatsayiOranForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = katsayiOran
        ? await updateKatsayiOran({
            IDGosterge: Number(katsayiOran.IDGosterge),
            ...toRequest(values),
          })
        : await insertKatsayiOran(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`Katsayı ${islem}.`);
        return;
      }

      toast.success(
        isEdit
          ? "Katsayı başarıyla güncellendi."
          : "Katsayı başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Katsayı ${islem}.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Katsayı Düzenle" : "Yeni Katsayı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Seçili ayın bordro katsayılarını güncelleyin."
              : "Yıl ve ay seçerek o aya ait bordro katsayılarını girin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
            <FormSelect
              control={form.control}
              name="Yil"
              label="Yıl"
              options={yilOptions}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormSelect
              control={form.control}
              name="Ay"
              label="Ay"
              options={AY_DATA}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            {KATSAYI_ALANLARI.map((alan) => (
              <FormInput
                key={alan.key}
                control={form.control}
                name={alan.key}
                label={alan.tip === "yuzde" ? `${alan.label} (%)` : alan.label}
                format={alan.tip === "money" ? "money" : "decimal"}
                placeholder={alan.tip === "money" ? "0,00" : "0"}
                disabled={isSaving}
              />
            ))}
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

export default KatsayiOranEkle;
