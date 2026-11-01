"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, getISODay } from "date-fns";
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
import { CustomDatePicker } from "@/components/customs/CustomDatePicker";

import { useInsertTatil, useUpdateTatil } from "@/hooks/sistem/use-sgk-bordro";
import { TatilInsertRequestType, TatilType } from "@/types/sistem/sgk-bordro";
import {
  DURUM_OPTIONS,
  RESMI_DINI_OPTIONS,
  toDurumValue,
} from "./tatil-options";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse dialog düzenleme modunda açılır */
  tatil?: TatilType | null;
};

const tatilSchema = z.object({
  tarih: z.date({ error: "Tarih seçiniz" }),
  durum: z.enum(["T", "Y"], { error: "Durum seçiniz" }),
  resmiDini: z.enum(["Resmi", "Dini"], { error: "Resmi / Dini seçiniz" }),
  aciklama: z.string().trim().min(1, "Açıklama giriniz"),
});

type TatilForm = z.infer<typeof tatilSchema>;

const getDefaultValues = (): TatilForm => ({
  tarih: new Date(),
  durum: "T",
  resmiDini: "Resmi",
  aciklama: "",
});

function toFormValues(tatil: TatilType): TatilForm {
  return {
    tarih: new Date(tatil.Tarih2),
    durum: toDurumValue(tatil.Durum),
    resmiDini: tatil.ResmiDini === "Dini" ? "Dini" : "Resmi",
    aciklama: tatil.Aciklama ?? "",
  };
}

// KodGun: 1 Pazartesi ... 7 Pazar (HAFTA_DATA ile aynı), HaftaKodu: tarihin yılı
function toRequest(values: TatilForm): TatilInsertRequestType {
  return {
    Tarih: format(values.tarih, "yyyy-MM-dd"),
    KodGun: getISODay(values.tarih),
    HaftaKodu: values.tarih.getFullYear(),
    Aciklama: values.aciklama.trim(),
    Durum: values.durum,
    ResmiDini: values.resmiDini,
  };
}

const TatilEkle = ({ open, onOpenChange, tatil }: Props) => {
  const isEdit = Boolean(tatil);
  const { mutateAsync: insertTatil, isPending: isInserting } = useInsertTatil();
  const { mutateAsync: updateTatil, isPending: isUpdating } = useUpdateTatil();
  const isSaving = isInserting || isUpdating;

  const form = useForm<TatilForm>({
    resolver: zodResolver(tatilSchema),
    defaultValues: tatil ? toFormValues(tatil) : getDefaultValues(),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues());
    } else if (tatil) {
      form.reset(toFormValues(tatil));
    }
  }, [open, tatil, form]);

  const handleSubmit = async (values: TatilForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = tatil
        ? await updateTatil({ IDTatil: tatil.IDTatil, ...toRequest(values) })
        : await insertTatil(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`Tatil ${islem}.`);
        return;
      }

      toast.success(
        isEdit ? "Tatil başarıyla güncellendi." : "Tatil başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Tatil ${islem}.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Tatil Düzenle" : "Yeni Tatil Ekle"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Tatil kaydının bilgilerini güncelleyin."
              : "Tarih seçerek yeni bir tatil günü tanımlayın."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <CustomDatePicker
              control={form.control}
              name="tarih"
              label="Tarih"
              mode="single"
              disabled={isSaving}
            />

            <FormSelect
              control={form.control}
              name="durum"
              label="Durum"
              options={DURUM_OPTIONS}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormSelect
              control={form.control}
              name="resmiDini"
              label="Resmi / Dini"
              options={RESMI_DINI_OPTIONS}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="aciklama"
              label="Açıklama"
              type="textarea"
              rows={3}
              placeholder="Örn. Cumhuriyet Bayramı"
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

export default TatilEkle;
