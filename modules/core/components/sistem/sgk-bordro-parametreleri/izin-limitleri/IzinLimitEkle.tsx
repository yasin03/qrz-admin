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
  useInsertIzinLimit,
  useUpdateIzinLimit,
} from "@/modules/core/hooks/sistem/use-sgk-bordro";
import {
  IzinLimitInsertRequestType,
  IzinLimitType,
} from "@/modules/core/types/sistem/sgk-bordro";
import { NITELIK_OPTIONS, toNitelikValue } from "./izin-limit-options";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse dialog düzenleme modunda açılır */
  izinLimit?: IzinLimitType | null;
};

// Input format="number" sadece rakam kabul ettiği için değerler ondalıksız.
const sayiAlani = (mesaj: string) => z.string().min(1, mesaj);

const izinLimitSchema = z
  .object({
    nitelik: z.enum(["YIL", "YAŞ"], { error: "Nitelik seçiniz" }),
    baslangic: sayiAlani("Başlangıç giriniz"),
    bitis: sayiAlani("Bitiş giriniz"),
    deger: sayiAlani("Değer giriniz"),
  })
  .refine((v) => Number(v.bitis) >= Number(v.baslangic), {
    path: ["bitis"],
    message: "Bitiş, başlangıçtan küçük olamaz",
  });

type IzinLimitForm = z.infer<typeof izinLimitSchema>;

const DEFAULT_VALUES: IzinLimitForm = {
  nitelik: "YIL",
  baslangic: "",
  bitis: "",
  deger: "",
};

function toFormValues(izinLimit: IzinLimitType): IzinLimitForm {
  return {
    nitelik: toNitelikValue(izinLimit.Nitelik),
    baslangic: String(izinLimit.Baslangic ?? ""),
    bitis: String(izinLimit.Bitis ?? ""),
    deger: String(izinLimit.Deger ?? ""),
  };
}

function toRequest(values: IzinLimitForm): IzinLimitInsertRequestType {
  return {
    Nitelik: values.nitelik,
    Baslangic: Number(values.baslangic),
    Bitis: Number(values.bitis),
    Deger: Number(values.deger),
  };
}

const IzinLimitEkle = ({ open, onOpenChange, izinLimit }: Props) => {
  const isEdit = Boolean(izinLimit);
  const { mutateAsync: insertIzinLimit, isPending: isInserting } =
    useInsertIzinLimit();
  const { mutateAsync: updateIzinLimit, isPending: isUpdating } =
    useUpdateIzinLimit();
  const isSaving = isInserting || isUpdating;

  const form = useForm<IzinLimitForm>({
    resolver: zodResolver(izinLimitSchema),
    defaultValues: izinLimit ? toFormValues(izinLimit) : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    } else if (izinLimit) {
      form.reset(toFormValues(izinLimit));
    }
  }, [open, izinLimit, form]);

  const handleSubmit = async (values: IzinLimitForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = izinLimit
        ? await updateIzinLimit({
            IDPersonelIzinLimit: izinLimit.IDPersonelIzinLimit,
            ...toRequest(values),
          })
        : await insertIzinLimit(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`İzin limiti ${islem}.`);
        return;
      }

      toast.success(
        isEdit
          ? "İzin limiti başarıyla güncellendi."
          : "İzin limiti başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `İzin limiti ${islem}.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "İzin Limiti Düzenle" : "Yeni İzin Limiti Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "İzin limiti kaydının bilgilerini güncelleyin."
              : "Yıl veya yaş aralığına göre izin limiti tanımlayın."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormSelect
              control={form.control}
              name="nitelik"
              label="Nitelik"
              options={NITELIK_OPTIONS}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />


              <FormInput
                control={form.control}
                name="baslangic"
                label="Başlangıç"
                format="number"
                placeholder="0"
                disabled={isSaving}
              />

              <FormInput
                control={form.control}
                name="bitis"
                label="Bitiş"
                format="number"
                placeholder="0"
                disabled={isSaving}
              />


            <FormInput
              control={form.control}
              name="deger"
              label="Değer"
              format="number"
              placeholder="0"
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

export default IzinLimitEkle;
