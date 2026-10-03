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
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { FormInput, FormSelect, FormSwitch } from "../../forms";
import { FormMultiSelect } from "../../forms/form-multi-select";
import { CustomDatePicker } from "../../customs/CustomDatePicker";

import { useAktifPersonelListesi } from "@/hooks/use-personel";
import {
  useInsertEklenti,
  useUpdateEklenti,
} from "@/hooks/use-bordro-parametre";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { EklentiResponseType } from "@/types/bordro-parametre";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  IDSube: string | number | null | undefined;
  /** Verilirse dialog düzenleme modunda açılır */
  eklenti?: EklentiResponseType | null;
};

const eklentiSchema = z.object({
  personeller: z.array(z.string()).min(1, "En az bir personel seçiniz"),
  odemeTipi: z.string().min(1, "Eklenti tipi seçiniz"),
  tutar: z
    .string()
    .min(1, "Tutar giriniz")
    .refine((v) => Number(v) > 0, "Tutar 0'dan büyük olmalı"),
  odemeTarihi: z.date({
    error: "Ödeme tarihi seçiniz",
  }),
  net: z.boolean(),
});

type EklentiForm = z.infer<typeof eklentiSchema>;

const DEFAULT_VALUES: EklentiForm = {
  personeller: [],
  odemeTipi: "",
  tutar: "",
  odemeTarihi: undefined as unknown as Date,
  net: false,
};

function toFormValues(eklenti: EklentiResponseType): EklentiForm {
  return {
    personeller: [String(eklenti.IDSubePersonel)],
    odemeTipi: String(eklenti.OdemeTipi ?? ""),
    tutar: String(eklenti.BordroOdemeTutari ?? ""),
    odemeTarihi: new Date(eklenti.OdemeTarihi),
    net: Boolean(eklenti.Net),
  };
}

const EklentiEkle = ({ open, onOpenChange, IDSube, eklenti }: Props) => {
  const isEdit = Boolean(eklenti);
  const { data: personelListesi = [], isLoading: isLoadingPersonel } =
    useAktifPersonelListesi();
  const { eklentiTipleri } = usePersonelSabitTanimlar();
  const { mutateAsync: insertEklenti, isPending: isInserting } =
    useInsertEklenti();
  const { mutateAsync: updateEklenti, isPending: isUpdating } =
    useUpdateEklenti();
  const isSaving = isInserting || isUpdating;

  const form = useForm<EklentiForm>({
    resolver: zodResolver(eklentiSchema),
    defaultValues: eklenti ? toFormValues(eklenti) : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    } else if (eklenti) {
      form.reset(toFormValues(eklenti));
    }
  }, [open, eklenti, form]);

  const handleUpdate = async (
    values: EklentiForm,
    current: EklentiResponseType,
  ) => {
    try {
      const result = await updateEklenti({
        IDSubePersonelYardim: current.IDSubePersonelYardim,
        BordroOdemeTutari: Number(values.tutar),
        OdemeTarihi: format(values.odemeTarihi, "yyyy-MM-dd"),
        OdemeTipi: values.odemeTipi,
        Net: values.net,
      });

      if (result && Number(result.test) !== 1) {
        toast.error("Eklenti güncellenemedi.");
        return;
      }

      toast.success("Eklenti başarıyla güncellendi.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Eklenti güncellenemedi.",
      );
    }
  };

  const personelOptions = useMemo(
    () =>
      personelListesi.map((p) => ({
        value: String(p.IDSubePersonel),
        label: p.AdSoyad,
        SicilNo: p.SicilNo,
      })),
    [personelListesi],
  );

  const handleSubmit = async (values: EklentiForm) => {
    if (eklenti) return handleUpdate(values, eklenti);

    if (!IDSube) {
      toast.error("Lütfen önce üstten şube seçimi yapın.");
      return;
    }

    try {
      const result = await insertEklenti({
        IDSube,
        IDSubePersonel: values.personeller.join("-"),
        BordroOdemeTutari: Number(values.tutar),
        OdemeTarihi: format(values.odemeTarihi, "yyyy-MM-dd"),
        OdemeTipi: values.odemeTipi,
        Net: values.net,
      });

      if (result && Number(result.test) !== 1) {
        toast.error("Eklenti oluşturulamadı.");
        return;
      }

      const eklenenSayi = result?.sayi ?? values.personeller.length;
      toast.success(
        eklenenSayi > 1
          ? `${eklenenSayi} personel için eklenti oluşturuldu.`
          : "Eklenti başarıyla oluşturuldu.",
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Eklenti oluşturulamadı.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Eklenti Düzenle" : "Yeni Eklenti Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Eklenti kaydının bilgilerini güncelleyin."
              : "Bir veya birden fazla personel seçerek eklenti kaydı oluşturun."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            {eklenti ? (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Personel</p>
                <p className="font-medium text-foreground">
                  {eklenti.AdSoyad || "-"}
                </p>
                {eklenti.BolumAdi && (
                  <p className="text-xs text-muted-foreground">
                    {eklenti.BolumAdi}
                  </p>
                )}
              </div>
            ) : (
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
            )}

            <FormSelect
              control={form.control}
              name="odemeTipi"
              label="Eklenti Tipi"
              options={eklentiTipleri}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="tutar"
              label="Tutar"
              placeholder="Eklenti tutarı"
              format="money"
              disabled={isSaving}
            />

            <CustomDatePicker
              control={form.control}
              name="odemeTarihi"
              label="Ödeme Tarihi"
              mode="single"
              disabled={isSaving}
            />

            <FormSwitch
              control={form.control}
              name="net"
              label="Net"
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

export default EklentiEkle;
