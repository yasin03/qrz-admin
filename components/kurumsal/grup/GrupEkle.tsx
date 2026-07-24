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

import { createGrupSchema, CreateGrupForm } from "@/schemas/grup.schema";
import { useCreateGrup } from "@/hooks/use-kurumsal-data";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
};

export default function GrupEkle({ open, onOpenChange }: Props) {
  const form = useForm<CreateGrupForm>({
    resolver: zodResolver(createGrupSchema),

    defaultValues: {
      GurupAdi: "",
      YetkiliKisi: "",
      Tel: "",
      IsTel: "",
      Durum: true,
      SadeceSirketYetkisi: false,
    },
  });

  const { mutateAsync, isPending } = useCreateGrup();

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: CreateGrupForm) => {
    try {
      await mutateAsync({
        ...values,
        Durum: values.Durum ? 1 : 0,
        SadeceSirketYetkisi: values.SadeceSirketYetkisi ? 1 : 0,
        SirketSayisi: 0,
      });

      toast.success("Grup başarıyla oluşturuldu.");

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Grup oluşturulamadı.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Grup</DialogTitle>

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
            placeholder="05xx xxx xx xx"
          />

          <FormInput
            control={form.control}
            name="IsTel"
            label="İş Telefonu"
            placeholder="0xxx xxx xx xx"
          />

          <FormSwitch
            control={form.control}
            name="Durum"
            label="Durum"
          />

          <FormSwitch
            control={form.control}
            name="SadeceSirketYetkisi"
            label="Sadece şirket yetkisi"
          />

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
