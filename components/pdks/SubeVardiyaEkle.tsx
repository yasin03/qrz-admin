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
} from "../ui/dialog";
import { Button } from "../ui/button";
import { FormInput, FormLabel, FormSelect, FormSwitch } from "../forms";

import { HAFTA_DATA } from "@/constants/data";
import { useInsertSubeVardiya, useUpdateSubeVardiya } from "@/hooks/use-pdks";
import { SubeVardiyaSaat } from "@/types/pdks";
import { Label } from "../ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duzenlenecekKayit?: SubeVardiyaSaat | null;
};

const saatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const vardiyaSchema = z
  .object({
    VardiyaAdi: z.string().min(2, "Vardiya adı en az 2 karakter olmalı"),
    BaslamaSaati: z.string().regex(saatRegex, "Geçerli bir saat giriniz"),
    BitisSaati: z.string().regex(saatRegex, "Geçerli bir saat giriniz"),
    Gece: z.boolean(),
    HT: z.string().min(1, "Hafta tatili seçiniz"),
  })
  .refine((data) => data.Gece || data.BaslamaSaati < data.BitisSaati, {
    message: "Bitiş saati başlangıçtan sonra olmalı",
    path: ["BitisSaati"],
  });

type VardiyaForm = z.infer<typeof vardiyaSchema>;

const DEFAULT_VALUES: VardiyaForm = {
  VardiyaAdi: "",
  BaslamaSaati: "",
  BitisSaati: "",
  Gece: false,
  HT: "",
};

const SubeVardiyaEkle = ({ open, onOpenChange, duzenlenecekKayit }: Props) => {
  const isEdit = Boolean(duzenlenecekKayit);
  const { mutateAsync: insertVardiya, isPending: isInserting } =
    useInsertSubeVardiya();
  const { mutateAsync: updateVardiya, isPending: isUpdating } =
    useUpdateSubeVardiya();
  const isSaving = isInserting || isUpdating;

  const form = useForm<VardiyaForm>({
    resolver: zodResolver(vardiyaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      duzenlenecekKayit
        ? {
            VardiyaAdi: duzenlenecekKayit.VardiyaAdi,
            BaslamaSaati: duzenlenecekKayit.BaslamaSaati,
            BitisSaati: duzenlenecekKayit.BitisSaati,
            Gece: duzenlenecekKayit.Gece,
            HT: String(duzenlenecekKayit.HT),
          }
        : DEFAULT_VALUES,
    );
  }, [open, duzenlenecekKayit, form]);

  const haftaGunuOptions = HAFTA_DATA.map((gun) => ({
    value: gun.value,
    label: gun.label,
  }));

  const handleSubmit = async (values: VardiyaForm) => {
    const htNumber = Number(values.HT);
    const HTGun =
      HAFTA_DATA.find((gun) => gun.value === values.HT)?.label ?? "";

    try {
      if (isEdit && duzenlenecekKayit) {
        await updateVardiya({
          IDSubeVardiyaSaat: duzenlenecekKayit.IDSubeVardiyaSaat,
          VardiyaAdi: values.VardiyaAdi,
          BaslamaSaati: values.BaslamaSaati,
          BitisSaati: values.BitisSaati,
          Gece: values.Gece,
          HT: htNumber,
          HTGun,
        });
        toast.success("Vardiya saati güncellendi.");
      } else {
        await insertVardiya({
          VardiyaAdi: values.VardiyaAdi,
          BaslamaSaati: values.BaslamaSaati,
          BitisSaati: values.BitisSaati,
          Gece: values.Gece,
          HT: htNumber,
          HTGun,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Vardiya Saatini Düzenle" : "Yeni Vardiya Saati Ekle"}
          </DialogTitle>
          <DialogDescription>
            Şubenize ait vardiya saat aralığını ve hafta tatilini tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormInput
              control={form.control}
              name="VardiyaAdi"
              label="Vardiya Adı"
              placeholder="Örn: Gündüz Vardiyası"
              disabled={isSaving}
            />

            <FormLabel label="Başlama / Bitiş Saatleri" vertical>
              <FormInput
                control={form.control}
                name="BaslamaSaati"
                type="time"
                disabled={isSaving}
              />

              <FormInput
                control={form.control}
                name="BitisSaati"
                type="time"
                disabled={isSaving}
              />
            </FormLabel>

            <FormSelect
              control={form.control}
              name="HT"
              label="Hafta Tatili"
              options={haftaGunuOptions}
              valueKey="value"
              labelKey="label"
              placeholder="Gün seçiniz"
              disabled={isSaving}
            />

            <FormSwitch
              control={form.control}
              name="Gece"
              label="Gece Vardiyası"
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

export default SubeVardiyaEkle;
