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

import { formatSaat } from "@/lib/format";
import { useInsertBolumVardiya, useUpdateBolumVardiya } from "@/hooks/use-pdks";
import { BolumVardiyaSaat } from "@/types/pdks";
import {
  VardiyaForm,
  VardiyaFormFields,
  VARDIYA_DEFAULT_VALUES,
  vardiyaSchema,
} from "./VardiyaFormFields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idBolum: number | null;
  duzenlenecekKayit?: BolumVardiyaSaat | null;
};

const BolumVardiyaEkle = ({
  open,
  onOpenChange,
  idBolum,
  duzenlenecekKayit,
}: Props) => {
  const isEdit = Boolean(duzenlenecekKayit);
  const { mutateAsync: insertVardiya, isPending: isInserting } =
    useInsertBolumVardiya();
  const { mutateAsync: updateVardiya, isPending: isUpdating } =
    useUpdateBolumVardiya();
  const isSaving = isInserting || isUpdating;

  const form = useForm<VardiyaForm>({
    resolver: zodResolver(vardiyaSchema),
    defaultValues: VARDIYA_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      duzenlenecekKayit
        ? {
            VardiyaAdi: duzenlenecekKayit.VardiyaAdi,
            BaslamaSaati: formatSaat(duzenlenecekKayit.BaslamaSaati),
            BitisSaati: formatSaat(duzenlenecekKayit.BitisSaati),
            Gece: duzenlenecekKayit.Gece,
            HaftaTatilGunu: duzenlenecekKayit.HaftaTatilGunu ?? "",
            ToplamMolaSuresi: formatSaat(duzenlenecekKayit.ToplamMolaSuresi),
          }
        : VARDIYA_DEFAULT_VALUES,
    );
  }, [open, duzenlenecekKayit, form]);

  const handleSubmit = async (values: VardiyaForm) => {
    if (!idBolum) {
      toast.error("Lütfen önce bir bölüm seçiniz.");
      return;
    }

    try {
      if (isEdit && duzenlenecekKayit) {
        await updateVardiya({
          IDBolumVardiyaSaat: duzenlenecekKayit.IDBolumVardiyaSaat,
          IDBolum: idBolum,
          VardiyaAdi: values.VardiyaAdi,
          BaslamaSaati: values.BaslamaSaati,
          BitisSaati: values.BitisSaati,
          Gece: values.Gece,
          HaftaTatilGunu: values.HaftaTatilGunu,
          ToplamMolaSuresi: values.ToplamMolaSuresi,
        });
        toast.success("Vardiya saati güncellendi.");
      } else {
        await insertVardiya({
          IDBolum: idBolum,
          VardiyaAdi: values.VardiyaAdi,
          BaslamaSaati: values.BaslamaSaati,
          BitisSaati: values.BitisSaati,
          Gece: values.Gece,
          HaftaTatilGunu: values.HaftaTatilGunu,
          ToplamMolaSuresi: values.ToplamMolaSuresi,
        });
        toast.success("Vardiya saati eklendi.");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Vardiya saati kaydedilemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Vardiya Saatini Düzenle" : "Yeni Vardiya Saati Ekle"}
          </DialogTitle>
          <DialogDescription>
            Bölüme ait vardiya saat aralığını ve hafta tatilini tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <VardiyaFormFields control={form.control} disabled={isSaving} />

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

export default BolumVardiyaEkle;
