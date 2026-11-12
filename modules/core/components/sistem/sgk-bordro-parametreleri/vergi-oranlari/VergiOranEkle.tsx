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
  useInsertVergiOran,
  useUpdateVergiOran,
} from "@/modules/core/hooks/sistem/use-sgk-bordro";
import {
  VergiOranInsertRequestType,
  VergiOranType,
} from "@/modules/core/types/sistem/sgk-bordro";
import { useYilOptions } from "@/modules/core/components/sistem/sgk-bordro-parametreleri/YilSecici";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Yeni kayıtta varsayılan yıl (listede seçili yıl) */
  defaultYil: string;
  /** Verilirse dialog düzenleme modunda açılır */
  vergiOran?: VergiOranType | null;
};

// Tutarlar money input'tan "190000.01" gibi düz ondalık string olarak gelir.
const vergiOranSchema = z
  .object({
    yil: z.string().min(1, "Yıl seçiniz"),
    baslangic: z.string().min(1, "Başlangıç tutarı giriniz"),
    bitis: z.string().min(1, "Bitiş tutarı giriniz"),
    yuzde: z
      .string()
      .min(1, "Yüzde giriniz")
      .refine(
        (v) => Number(v) >= 0 && Number(v) <= 100,
        "Yüzde 0 ile 100 arasında olmalı",
      ),
  })
  .refine((v) => Number(v.bitis) >= Number(v.baslangic), {
    path: ["bitis"],
    message: "Bitiş, başlangıçtan küçük olamaz",
  });

type VergiOranForm = z.infer<typeof vergiOranSchema>;

const getDefaultValues = (yil: string): VergiOranForm => ({
  yil,
  baslangic: "",
  bitis: "",
  yuzde: "",
});

function toFormValues(vergiOran: VergiOranType): VergiOranForm {
  return {
    yil: String(vergiOran.Yil ?? ""),
    baslangic: String(vergiOran.Baslangic ?? ""),
    bitis: String(vergiOran.Bitis ?? ""),
    yuzde: String(vergiOran.Yuzde ?? ""),
  };
}

function toRequest(values: VergiOranForm): VergiOranInsertRequestType {
  return {
    Yil: Number(values.yil),
    Baslangic: Number(values.baslangic),
    Bitis: Number(values.bitis),
    Yuzde: Number(values.yuzde),
  };
}

const VergiOranEkle = ({
  open,
  onOpenChange,
  defaultYil,
  vergiOran,
}: Props) => {
  const isEdit = Boolean(vergiOran);
  const { mutateAsync: insertVergiOran, isPending: isInserting } =
    useInsertVergiOran();
  const { mutateAsync: updateVergiOran, isPending: isUpdating } =
    useUpdateVergiOran();
  const isSaving = isInserting || isUpdating;

  const yilOptions = useYilOptions(defaultYil, String(vergiOran?.Yil ?? ""));

  const form = useForm<VergiOranForm>({
    resolver: zodResolver(vergiOranSchema),
    defaultValues: vergiOran
      ? toFormValues(vergiOran)
      : getDefaultValues(defaultYil),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues(defaultYil));
    } else if (vergiOran) {
      form.reset(toFormValues(vergiOran));
    }
  }, [open, vergiOran, defaultYil, form]);

  const handleSubmit = async (values: VergiOranForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = vergiOran
        ? await updateVergiOran({
            IDVergiYuzde: vergiOran.IDVergiYuzde,
            ...toRequest(values),
          })
        : await insertVergiOran(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`Vergi oranı ${islem}.`);
        return;
      }

      toast.success(
        isEdit
          ? "Vergi oranı başarıyla güncellendi."
          : "Vergi oranı başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Vergi oranı ${islem}.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Vergi Oranı Düzenle" : "Yeni Vergi Oranı Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Vergi dilimi bilgilerini güncelleyin."
              : "Gelir aralığı ve uygulanacak vergi yüzdesini tanımlayın."}
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
              name="baslangic"
              label="Başlangıç"
              format="money"
              placeholder="0,00"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="bitis"
              label="Bitiş"
              format="money"
              placeholder="0,00"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="yuzde"
              label="Yüzde (%)"
              format="decimal"
              placeholder="0-100"
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

export default VergiOranEkle;
