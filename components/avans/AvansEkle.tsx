"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import { FormInput } from "../forms";
import { FormMultiSelect } from "../forms/form-multi-select";

import { useAktifPersonelListesi } from "@/hooks/use-personel";
import { useInsertAvans } from "@/hooks/use-avans";
import { CustomDatePicker } from "../customs/CustomDatePicker";
import { clampNumberString } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const avansSchema = z.object({
  personeller: z.array(z.string()).min(1, "En az bir personel seçiniz"),
  tutar: z
    .string()
    .min(1, "Tutar giriniz")
    .refine((v) => Number(v) > 0, "Tutar 0'dan büyük olmalı"),
  taksitSayisi: z.string().min(1, "Taksit sayısı giriniz"),
  bordroKesintiTutari: z.string().optional(),
  odemeBaslangicTarihi: z.date({
    error: "Ödeme başlangıç tarihi seçiniz",
  }),
  mesaj: z.string().optional(),
});

type AvansForm = z.infer<typeof avansSchema>;

const DEFAULT_VALUES: AvansForm = {
  personeller: [],
  tutar: "",
  taksitSayisi: "",
  bordroKesintiTutari: "",
  odemeBaslangicTarihi: undefined as unknown as Date,
  mesaj: "",
};

const AvansEkle = ({ open, onOpenChange }: Props) => {
  const { data: personelListesi = [], isLoading: isLoadingPersonel } =
    useAktifPersonelListesi();
  const { mutateAsync: insertAvans, isPending: isSaving } = useInsertAvans();

  const form = useForm<AvansForm>({
    resolver: zodResolver(avansSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, form]);

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

  const personelOptions = useMemo(
    () =>
      personelListesi.map((p) => ({
        value: String(p.IDSubePersonel),
        label: p.AdSoyad,
        SicilNo: p.SicilNo,
      })),
    [personelListesi],
  );

  const handleSubmit = async (values: AvansForm) => {
    try {
      await insertAvans({
        IDSubePersonel: values.personeller.join("-"),
        Tutar: Number(values.tutar),
        TaksitSayisi: values.taksitSayisi,
        BordroKesintiTutari: Number(values.bordroKesintiTutari || 0),
        Mesaj: values.mesaj ?? "",
        OdemeBaslangicTarihi: format(values.odemeBaslangicTarihi, "yyyy-MM-dd"),
      });

      toast.success(
        values.personeller.length > 1
          ? `${values.personeller.length} personel için avans oluşturuldu.`
          : "Avans başarıyla oluşturuldu.",
      );

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Avans oluşturulamadı.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Avans Ekle</DialogTitle>
          <DialogDescription>
            Bir veya birden fazla personel seçerek avans kaydı oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            <FormMultiSelect
              control={form.control}
              name="personeller"
              label="Personel"
              options={personelOptions}
              valueKey="value"
              labelKey="label"
              extraSearchKeys={["SicilNo"]}
              placeholder="Personel seçiniz"
              searchPlaceholder="İsim veya sicil no ile ara..."
              emptyMessage="Personel bulunamadı."
              disabled={isLoadingPersonel || isSaving}
            />

            <FormInput
              control={form.control}
              name="tutar"
              label="Tutar"
              placeholder="Avans tutarı"
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
              placeholder="Aylık ödeme tutarı"
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

export default AvansEkle;
