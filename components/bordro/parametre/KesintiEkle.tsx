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
import { FormInput, FormSelect } from "../../forms";
import { FormMultiSelect } from "../../forms/form-multi-select";
import { CustomDatePicker } from "../../customs/CustomDatePicker";

import { useAktifPersonelListesi } from "@/hooks/use-personel";
import {
  useInsertKesinti,
  useUpdateKesinti,
} from "@/hooks/use-bordro-parametre";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { KesintiResponseType } from "@/types/bordro-parametre";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  IDSube: string | number | null | undefined;
  /** Verilirse dialog düzenleme modunda açılır */
  kesinti?: KesintiResponseType | null;
};

const kesintiSchema = z.object({
  personeller: z.array(z.string()).min(1, "En az bir personel seçiniz"),
  kesintiTipi: z.string().min(1, "Kesinti tipi seçiniz"),
  tutar: z
    .string()
    .min(1, "Tutar giriniz")
    .refine((v) => Number(v) > 0, "Tutar 0'dan büyük olmalı"),
  kesintiTarihi: z.date({
    error: "Kesinti tarihi seçiniz",
  }),
});

type KesintiForm = z.infer<typeof kesintiSchema>;

const DEFAULT_VALUES: KesintiForm = {
  personeller: [],
  kesintiTipi: "",
  tutar: "",
  kesintiTarihi: undefined as unknown as Date,
};

function toFormValues(kesinti: KesintiResponseType): KesintiForm {
  return {
    personeller: [String(kesinti.IDSubePersonel)],
    kesintiTipi: String(kesinti.KesintiTipi ?? ""),
    tutar: String(kesinti.BordroKesintiTutari ?? ""),
    kesintiTarihi: new Date(kesinti.KesintiTarihi),
  };
}

const KesintiEkle = ({ open, onOpenChange, IDSube, kesinti }: Props) => {
  const isEdit = Boolean(kesinti);
  const { data: personelListesi = [], isLoading: isLoadingPersonel } =
    useAktifPersonelListesi();
  const { kesintiTipleri } = usePersonelSabitTanimlar();
  const { mutateAsync: insertKesinti, isPending: isInserting } =
    useInsertKesinti();
  const { mutateAsync: updateKesinti, isPending: isUpdating } =
    useUpdateKesinti();
  const isSaving = isInserting || isUpdating;

  const form = useForm<KesintiForm>({
    resolver: zodResolver(kesintiSchema),
    defaultValues: kesinti ? toFormValues(kesinti) : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
    } else if (kesinti) {
      form.reset(toFormValues(kesinti));
    }
  }, [open, kesinti, form]);

  const handleUpdate = async (
    values: KesintiForm,
    current: KesintiResponseType,
  ) => {
    try {
      const result = await updateKesinti({
        IDSubePersonelOzelKesinti: current.IDSubePersonelOzelKesinti,
        BordroKesintiTutari: Number(values.tutar),
        KesintiTarihi: format(values.kesintiTarihi, "yyyy-MM-dd"),
        KesintiTipi: values.kesintiTipi,
      });

      if (result && Number(result.test) !== 1) {
        toast.error("Kesinti güncellenemedi.");
        return;
      }

      toast.success("Kesinti başarıyla güncellendi.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kesinti güncellenemedi.",
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

  const handleSubmit = async (values: KesintiForm) => {
    if (kesinti) return handleUpdate(values, kesinti);

    if (!IDSube) {
      toast.error("Lütfen önce üstten şube seçimi yapın.");
      return;
    }

    try {
      const result = await insertKesinti({
        IDSube,
        IDSubePersonel: values.personeller.join("-"),
        BordroKesintiTutari: Number(values.tutar),
        KesintiTarihi: format(values.kesintiTarihi, "yyyy-MM-dd"),
        KesintiTipi: values.kesintiTipi,
      });

      if (result && Number(result.test) !== 1) {
        toast.error("Kesinti oluşturulamadı.");
        return;
      }

      const eklenenSayi = result?.sayi ?? values.personeller.length;
      toast.success(
        eklenenSayi > 1
          ? `${eklenenSayi} personel için kesinti oluşturuldu.`
          : "Kesinti başarıyla oluşturuldu.",
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kesinti oluşturulamadı.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Kesinti Düzenle" : "Yeni Kesinti Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Kesinti kaydının bilgilerini güncelleyin."
              : "Bir veya birden fazla personel seçerek kesinti kaydı oluşturun."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            {kesinti ? (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Personel</p>
                <p className="font-medium text-foreground">
                  {kesinti.AdSoyad || "-"}
                </p>
                {kesinti.BolumAdi && (
                  <p className="text-xs text-muted-foreground">
                    {kesinti.BolumAdi}
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
              name="kesintiTipi"
              label="Kesinti Tipi"
              options={kesintiTipleri}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormInput
              control={form.control}
              name="tutar"
              label="Tutar"
              placeholder="Kesinti tutarı"
              format="money"
              disabled={isSaving}
            />

            <CustomDatePicker
              control={form.control}
              name="kesintiTarihi"
              label="Kesinti Tarihi"
              mode="single"
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

export default KesintiEkle;
