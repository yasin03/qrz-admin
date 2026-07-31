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
import { FormSubmitButton } from "@/components/forms";

import { useCreateBolum, useUpdateBolum } from "@/hooks/use-kurumsal-data";
import { BolumType } from "@/types/kurumsal/bolum";
import { BolumForm, bolumSchema } from "@/schemas/kurumsal/bolum.schema";
import { BolumFormFields } from "./BolumFormFields";

const DEFAULT_VALUES: BolumForm = {
  BolumAdi: "",
};

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  idSube: number;
  bolum?: BolumType | null;
};

export default function BolumEkle({
  open,
  onOpenChange,
  idSube,
  bolum,
}: Props) {
  const isEditMode = !!bolum;

  const form = useForm<BolumForm>({
    resolver: zodResolver(bolumSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { mutateAsync: createBolum, isPending: isCreating } = useCreateBolum();
  const { mutateAsync: updateBolum, isPending: isUpdating } = useUpdateBolum();
  const isPending = isEditMode ? isUpdating : isCreating;

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (bolum) {
      form.reset({
        BolumAdi: bolum.BolumAdi,
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, bolum, form]);

  const onSubmit = async (values: BolumForm) => {
    try {
      const payload = {
        ...values,
      };

      if (isEditMode && bolum) {
        await updateBolum({
          IDBolum: bolum.IDBolum,
          IDSube: bolum.IDSube,
          ...payload,
        });
        toast.success("Bölüm başarıyla güncellendi.");
      } else {
        await createBolum({
          IDSube: idSube,
          ...payload,
        });
        toast.success("Bölüm başarıyla oluşturuldu.");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isEditMode ? "Bölüm güncellenemedi." : "Bölüm oluşturulamadı."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Bölümü Düzenle" : "Yeni Bölüm"}
          </DialogTitle>
          <DialogDescription>Bölüm bilgilerini giriniz.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <BolumFormFields control={form.control} />

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
