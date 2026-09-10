"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Label } from "../ui/label";
import { FormSelect } from "../forms/form-select";
import { FormMultiSelect } from "../forms/form-multi-select";

import { useAktifPersonelListesi } from "@/hooks/use-personel";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { useInsertIzin } from "@/hooks/use-izin";
import { CustomDatePicker } from "../customs/CustomDatePicker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const izinSchema = z.object({
  personeller: z.array(z.string()).min(1, "En az bir personel seçiniz"),
  tarihAraligi: z
    .custom<DateRange>()
    .refine((val) => Boolean(val?.from && val?.to), {
      message: "Başlangıç ve bitiş tarihi seçiniz",
    }),
  izinTipi: z.string().min(1, "İzin tipi seçiniz"),
});

type IzinForm = z.infer<typeof izinSchema>;

const DEFAULT_VALUES: IzinForm = {
  personeller: [],
  tarihAraligi: undefined as unknown as DateRange,
  izinTipi: "",
};

const IzinEkle = ({ open, onOpenChange }: Props) => {
  const { data: personelListesi = [], isLoading: isLoadingPersonel } =
    useAktifPersonelListesi();
  const { izinTipleri } = usePersonelSabitTanimlar();
  const { mutateAsync: insertIzin, isPending: isSaving } = useInsertIzin();

  const form = useForm<IzinForm>({
    resolver: zodResolver(izinSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, form]);

  const tarihAraligi = form.watch("tarihAraligi");

  const gunSayisi = useMemo(() => {
    if (!tarihAraligi?.from || !tarihAraligi?.to) return null;
    return differenceInCalendarDays(tarihAraligi.to, tarihAraligi.from) + 1;
  }, [tarihAraligi]);

  const personelOptions = useMemo(
    () =>
      personelListesi.map((p) => ({
        value: String(p.IDSubePersonel),
        label: p.AdSoyad,
        SicilNo: p.SicilNo,
      })),
    [personelListesi],
  );

  const izinTipiOptions = useMemo(
    () => izinTipleri.map((t) => ({ value: t.value, label: t.label })),
    [izinTipleri],
  );

  const handleSubmit = async (values: IzinForm) => {
    try {
      const izinTipiLabel =
        izinTipleri.find((t) => t.value === values.izinTipi)?.label ??
        values.izinTipi;

      await insertIzin({
        IDSubePersonel: values.personeller.join("-"),
        BaslangicTarihi: format(values.tarihAraligi.from as Date, "yyyy-MM-dd"),
        BitisTarihi: format(values.tarihAraligi.to as Date, "yyyy-MM-dd"),
        Gun: String(gunSayisi ?? 0),
        Aciklama: izinTipiLabel,
        AitOlduguYil: "0",
        CizelgeDurum: "0",
      });

      toast.success(
        values.personeller.length > 1
          ? `${values.personeller.length} personel için izin oluşturuldu.`
          : "İzin başarıyla oluşturuldu.",
      );

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "İzin oluşturulamadı.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni İzin Ekle</DialogTitle>
          <DialogDescription>
            Bir veya birden fazla personel seçerek izin kaydı oluşturun.
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

            <CustomDatePicker
              control={form.control}
              name="tarihAraligi"
              label="Tarih Aralığı"
              mode="range"
              disabled={isSaving}
            />

            <FormSelect
              control={form.control}
              name="izinTipi"
              label="İzin Tipi"
              options={izinTipiOptions}
              valueKey="value"
              labelKey="label"
              placeholder="İzin tipi seçiniz"
              disabled={isSaving}
            />

            {gunSayisi !== null && (
              <Field>
                <div className="flex items-center gap-3">
                  <Label className="w-1/4 shrink-0">Gün</Label>
                  <div className="flex-1 text-sm text-muted-foreground">
                    {gunSayisi} gün
                  </div>
                </div>
              </Field>
            )}
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

export default IzinEkle;
