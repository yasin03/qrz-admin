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
import { FormInput } from "@/components/forms";

import {
  useInsertMeslekKodu,
  useUpdateMeslekKodu,
} from "@/hooks/sistem/use-sgk-bordro";
import {
  MeslekKoduInsertRequestType,
  MeslekKoduType,
} from "@/types/sistem/sgk-bordro";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse dialog düzenleme modunda açılır */
  meslekKodu?: MeslekKoduType | null;
};

// Kod varchar; baştaki sıfır korunsun diye string olarak tutuluyor ("0110.01").
const meslekKoduSchema = z.object({
  kod: z.string().trim().min(1, "Kod giriniz"),
  aciklama: z.string().trim().min(1, "Açıklama giriniz"),
});

type MeslekKoduForm = z.infer<typeof meslekKoduSchema>;

const DEFAULT_VALUES: MeslekKoduForm = {
  kod: "",
  aciklama: "",
};

function toFormValues(meslekKodu: MeslekKoduType): MeslekKoduForm {
  return {
    kod: String(meslekKodu.Kod ?? ""),
    aciklama: meslekKodu.Aciklama ?? "",
  };
}

function toRequest(values: MeslekKoduForm): MeslekKoduInsertRequestType {
  return {
    Kod: values.kod.trim(),
    Aciklama: values.aciklama.trim(),
  };
}

const MeslekKoduEkle = ({ open, onOpenChange, meslekKodu }: Props) => {
  const isEdit = Boolean(meslekKodu);
  const { mutateAsync: insertMeslekKodu, isPending: isInserting } =
    useInsertMeslekKodu();
  const { mutateAsync: updateMeslekKodu, isPending: isUpdating } =
    useUpdateMeslekKodu();
  const isSaving = isInserting || isUpdating;

  const form = useForm<MeslekKoduForm>({
    resolver: zodResolver(meslekKoduSchema),
    defaultValues: meslekKodu ? toFormValues(meslekKodu) : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    } else if (meslekKodu) {
      form.reset(toFormValues(meslekKodu));
    }
  }, [open, meslekKodu, form]);

  const handleSubmit = async (values: MeslekKoduForm) => {
    const islem = isEdit ? "güncellenemedi" : "oluşturulamadı";

    try {
      const result = meslekKodu
        ? await updateMeslekKodu({
            IDPersonelMeslekKodu: meslekKodu.IDPersonelMeslekKodu,
            ...toRequest(values),
          })
        : await insertMeslekKodu(toRequest(values));

      if (result && Number(result.test) !== 1) {
        toast.error(`Meslek kodu ${islem}.`);
        return;
      }

      toast.success(
        isEdit
          ? "Meslek kodu başarıyla güncellendi."
          : "Meslek kodu başarıyla oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Meslek kodu ${islem}.`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Meslek Kodu Düzenle" : "Yeni Meslek Kodu Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Meslek kodu bilgilerini güncelleyin."
              : "SGK meslek kodu ve açıklamasını tanımlayın."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormInput
              control={form.control}
              name="kod"
              label="Kod"
              placeholder="0110.01"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="aciklama"
              label="Açıklama"
              placeholder="Genelkurmay Başkanı"
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

export default MeslekKoduEkle;
