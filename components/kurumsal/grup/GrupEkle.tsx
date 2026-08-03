"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

import {
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
} from "@/components/forms";

import {
  createGrupSchema,
  CreateGrupForm,
} from "@/schemas/kurumsal/grup.schema";
import { useCreateGrup, useUpdateGrup } from "@/hooks/use-kurumsal-data";
import { GrupType } from "@/types/kurumsal/grup";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  /** Verilirse düzenleme modu (o grubun bilgileriyle form doldurulur), verilmezse ekleme modu. */
  grup?: GrupType | null;
};

const DEFAULT_VALUES: CreateGrupForm = {
  GurupAdi: "",
  YetkiliKisi: "",
  Tel: "",
  IsTel: "",
  Durum: true,
  SadeceSirketYetkisi: false,
};

function toBooleanFlag(value: unknown) {
  return value === true || value === 1 || value === "1";
}

export default function GrupEkle({ open, onOpenChange, grup }: Props) {
  const isEditMode = !!grup;

  const form = useForm<CreateGrupForm>({
    resolver: zodResolver(createGrupSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { mutateAsync: createGrup, isPending: isCreating } = useCreateGrup();
  const { mutateAsync: updateGrup, isPending: isUpdating } = useUpdateGrup();
  const isPending = isEditMode ? isUpdating : isCreating;

  // Modal açıldığında: düzenleme modundaysa grubun verileriyle, değilse
  // boş değerlerle doldur. Kapanınca sıfırla.
  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (grup) {
      form.reset({
        GurupAdi: grup.GurupAdi,
        YetkiliKisi: grup.YetkiliKisi,
        Tel: grup.Tel ?? "",
        IsTel: grup.IsTel ?? "",
        Durum: toBooleanFlag(grup.Durum),
        // NOT: UPDATE_GRUP proc'u SadeceSirketYetkisi almıyor, bu yüzden
        // düzenleme modunda bu alan aşağıda gizleniyor — form değeri
        // gönderilmeyecek olsa da default'u koruyoruz.
        SadeceSirketYetkisi: toBooleanFlag(grup.SadeceSirketYetkisi),
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, grup, form]);

  const onSubmit = async (values: CreateGrupForm) => {
    try {
      if (isEditMode && grup) {
        await updateGrup({
          IDGurup: grup.IDGurup,
          GurupAdi: values.GurupAdi,
          YetkiliKisi: values.YetkiliKisi,
          Tel: values.Tel,
          IsTel: values.IsTel,
          Durum: values.Durum ? 1 : 0,
          SadeceSirketYetkisi: values.SadeceSirketYetkisi ? 1 : 0,
          SirketSayisi: grup.SirketSayisi,
        });
        toast.success("Grup başarıyla güncellendi.");
      } else {
        await createGrup({
          ...values,
          Durum: values.Durum ? 1 : 0,
          SadeceSirketYetkisi: values.SadeceSirketYetkisi ? 1 : 0,
          SirketSayisi: 0,
        });
        toast.success("Grup başarıyla oluşturuldu.");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isEditMode ? "Grup güncellenemedi." : "Grup oluşturulamadı."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Grubu Düzenle" : "Yeni Grup"}
          </DialogTitle>
          <DialogDescription>Grup bilgilerini giriniz.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            control={form.control}
            name="GurupAdi"
            label="Grup Adı"
            required
            placeholder="Grup adını giriniz"
          />

          <FormInput
            control={form.control}
            name="YetkiliKisi"
            label="Yetkili Kişi"
            required
            placeholder="Yetkili kişi"
          />

          <FormInput
            control={form.control}
            name="Tel"
            label="Telefon"
            placeholder="5xx xxx xx xx"
            format="tel"
          />

          <FormInput
            control={form.control}
            name="IsTel"
            label="İş Telefonu"
            placeholder="xxx xxx xx xx"
            format="tel"
          />

          <FormSwitch control={form.control} name="Durum" label="Durum" />

          {/* UPDATE_GRUP proc'u bu alanı desteklemiyor, sadece ekleme modunda göster */}
          {!isEditMode && (
            <FormSwitch
              control={form.control}
              name="SadeceSirketYetkisi"
              label="Sadece şirket yetkisi"
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              appearance="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>

            <FormSubmitButton loading={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
