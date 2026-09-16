"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { User } from "@/stores/auth-store";
import { CustomDatePicker } from "../customs/CustomDatePicker";
import { FormInput } from "../forms";
import { Button } from "../ui/button";
import { useInsertTalep } from "@/hooks/use-avans";
import { clampNumberString } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

const avansTalepSchema = z.object({
  tutar: z
    .string()
    .min(1, "Tutar giriniz")
    .refine((v) => Number(v) > 0, "Tutar 0'dan büyük olmalı"),
  taksitSayisi: z.string().min(1, "Taksit sayısı giriniz"),
  bordroKesintiTutari: z
    .string()
    .min(1, "Bordro kesinti tutarı giriniz")
    .refine((v) => Number(v) >= 0, "Geçerli bir tutar giriniz"),
  odemeBaslangicTarihi: z.date({
    error: "Ödeme başlangıç tarihi seçiniz",
  }),
  mesaj: z.string().optional(),
});

type AvansTalepForm = z.infer<typeof avansTalepSchema>;

const DEFAULT_VALUES: AvansTalepForm = {
  tutar: "",
  taksitSayisi: "",
  bordroKesintiTutari: "",
  odemeBaslangicTarihi: undefined as unknown as Date,
  mesaj: "",
};

const TalepEkle = ({ open, onOpenChange, user }: Props) => {
  const form = useForm<AvansTalepForm>({
    resolver: zodResolver(avansTalepSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { mutateAsync: insertTalep, isPending: isSaving } = useInsertTalep();
  const tutar = form.watch("tutar");
  const taksitSayisi = form.watch("taksitSayisi");

  useEffect(() => {
    const tutarSayi = Number(tutar);
    const taksitSayi = Number(taksitSayisi);

    if (
      !tutar ||
      !taksitSayisi ||
      Number.isNaN(tutarSayi) ||
      Number.isNaN(taksitSayi) ||
      taksitSayi <= 0
    ) {
      form.setValue("bordroKesintiTutari", "");
      return;
    }

    form.setValue("bordroKesintiTutari", String(tutarSayi / taksitSayi));
  }, [tutar, taksitSayisi, form]);

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, form]);

  const handleSubmit = async (values: AvansTalepForm) => {
    if (!user?.IDSubePersonel) {
      toast.error("Kullanıcı bilgisi bulunamadı.");
      return;
    }

    try {
      await insertTalep({
        IDSubePersonel: String(user.IDSubePersonel),
        Tutar: Number(values.tutar),
        TaksitSayisi: values.taksitSayisi,
        BordroKesintiTutari: Number(values.bordroKesintiTutari),
        Mesaj: values.mesaj ?? "",
        OdemeBaslangicTarihi: values.odemeBaslangicTarihi.toISOString(),
      });

      toast.success("Avans talebiniz oluşturuldu.");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Avans talebi oluşturulamadı.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Avans Talebi</DialogTitle>
          <DialogDescription>
            {user?.Ad} için avans talebi oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormInput
              control={form.control}
              name="tutar"
              label="Tutar"
              placeholder="Talep edilen avans tutarı"
              format="money"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="taksitSayisi"
              label="Taksit Sayısı"
              placeholder="Taksit sayısını giriniz"
              format="number"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="bordroKesintiTutari"
              label="Aylık Ödeme Tutarı"
              format="money"
              readOnly
            />

            <CustomDatePicker
              control={form.control}
              name="odemeBaslangicTarihi"
              label="Ödeme Başlangıç Tarihi"
              mode="single"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="mesaj"
              label="Mesaj"
              type="textarea"
              placeholder="Eklemek istediğiniz bir not varsa yazınız"
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
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TalepEkle;
