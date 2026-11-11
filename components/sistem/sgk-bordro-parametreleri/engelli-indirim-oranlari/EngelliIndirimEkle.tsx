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

import {
  useInsertEngelliIndirim,
  useUpdateEngelliIndirim,
} from "@/hooks/sistem/use-sgk-bordro";
import {
  EngelliIndirimInsertRequestType,
  EngelliIndirimType,
} from "@/types/sistem/sgk-bordro";
import { useYilOptions } from "@/components/sistem/sgk-bordro-parametreleri/YilSecici";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Yeni kayıtta varsayılan yıl (listede seçili yıl) */
  defaultYil: string;
  /** Verilirse dialog düzenleme modunda açılır */
  engelliIndirim?: EngelliIndirimType | null;
};

// Tutar money input'tan "12000.50" gibi düz ondalık string olarak gelir.
const engelliIndirimSchema = z.object({
  yil: z.string().min(1, "Yıl seçiniz"),
  derece: z
    .string()
    .min(1, "Derece giriniz")
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      "Derece pozitif tam sayı olmalı",
    ),
  aciklama: z.string().trim().min(1, "Açıklama giriniz"),
  indirimTutari: z.string().min(1, "İndirim tutarı giriniz"),
});

type EngelliIndirimForm = z.infer<typeof engelliIndirimSchema>;

const getDefaultValues = (yil: string): EngelliIndirimForm => ({
  yil,
  derece: "",
  aciklama: "",
  indirimTutari: "",
});

function toFormValues(engelliIndirim: EngelliIndirimType): EngelliIndirimForm {
  return {
    yil: String(engelliIndirim.Yil ?? ""),
    derece: String(engelliIndirim.Derece ?? ""),
    aciklama: engelliIndirim.Aciklama ?? "",
    indirimTutari: String(engelliIndirim.IndirimTutari ?? ""),
  };
}

function toRequest(
  values: EngelliIndirimForm,
): EngelliIndirimInsertRequestType {
  return {
    Yil: Number(values.yil),
    Derece: Number(values.derece),
    Aciklama: values.aciklama.trim(),
    IndirimTutari: Number(values.indirimTutari),
  };
}

const EngelliIndirimEkle = ({
  open,
  onOpenChange,
  defaultYil,
  engelliIndirim,
}: Props) => {
  const isEdit = Boolean(engelliIndirim);
  const { mutateAsync: insertEngelliIndirim, isPending: isInserting } =
    useInsertEngelliIndirim();
  const { mutateAsync: updateEngelliIndirim, isPending: isUpdating } =
    useUpdateEngelliIndirim();
  const isSaving = isInserting || isUpdating;

  const yilOptions = useYilOptions(
    defaultYil,
    String(engelliIndirim?.Yil ?? ""),
  );

  const form = useForm<EngelliIndirimForm>({
    resolver: zodResolver(engelliIndirimSchema),
    defaultValues: engelliIndirim
      ? toFormValues(engelliIndirim)
      : getDefaultValues(defaultYil),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues(defaultYil));
    } else if (engelliIndirim) {
      form.reset(toFormValues(engelliIndirim));
    }
  }, [open, engelliIndirim, defaultYil, form]);

  const handleSubmit = async (values: EngelliIndirimForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = engelliIndirim
        ? await updateEngelliIndirim({
            IDPersonelEngelliIndirim: engelliIndirim.IDPersonelEngelliIndirim,
            ...toRequest(values),
          })
        : await insertEngelliIndirim(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`Engelli indirimi ${islem}.`);
        return;
      }

      toast.success(
        isEdit
          ? "Engelli indirimi başarıyla güncellendi."
          : "Engelli indirimi başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Engelli indirimi ${islem}.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Engelli İndirimi Düzenle" : "Yeni Engelli İndirimi Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Engelli indirimi bilgilerini güncelleyin."
              : "Engellilik derecesi ve uygulanacak indirim tutarını tanımlayın."}
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

            <FormInput
              control={form.control}
              name="derece"
              label="Derece"
              format="number"
              placeholder="1"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="aciklama"
              label="Açıklama"
              placeholder="1. DERECE ENGELLİ İNDİRİMİ"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="indirimTutari"
              label="İndirim Tutarı"
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

export default EngelliIndirimEkle;
