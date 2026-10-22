"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect } from "@/components/forms";
import { FormMultiSelect } from "@/components/forms/form-multi-select";
import { CustomDatePicker } from "@/components/customs/CustomDatePicker";

import { useAktifPersonelListesi } from "@/hooks/use-personel";
import { useInsertMesai, useUpdateMesai } from "@/hooks/use-bordro-parametre";
import { usePersonelSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { MesaiResponseType } from "@/types/bordro-parametre";
import {
  MESAI_MAX_SAAT,
  getMesaiBirim,
  isGunBrut as checkGunBrut,
  toMesaiTipiOptions,
} from "./mesai-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  IDSube: string | number | null | undefined;
  /** Verilirse dialog düzenleme modunda açılır */
  mesai?: MesaiResponseType | null;
};

const NET_OPTIONS = [
  { value: "false", label: "Brüt" },
  { value: "true", label: "Net" },
];

// Birim (gün/saat) mesai tipinin adından çıktığı için şema, seçenek listesine
// erişebilmek adına component içinde üretiliyor.
const createMesaiSchema = (
  getBirim: (mesaiTipi: string) => ReturnType<typeof getMesaiBirim>,
) =>
  z
    .object({
      personeller: z.array(z.string()).min(1, "En az bir personel seçiniz"),
      mesaiTipi: z.string().min(1, "Mesai tipi seçiniz"),
      net: z.boolean(),
      // API'ye giden Deger: Gün+Brüt → "1", Saat+Brüt → saat, Net → tutar
      deger: z.string(),
      tarih: z.date({
        error: "Tarih seçiniz",
      }),
    })
    .superRefine((values, ctx) => {
      const birim = getBirim(values.mesaiTipi);
      const deger = Number(values.deger);

      // Mesai tipi seçilmeden değer alanı görünmüyor; hatayı mesaiTipi veriyor.
      if (!birim) return;

      if (!values.deger || !(deger > 0)) {
        ctx.addIssue({
          code: "custom",
          path: ["deger"],
          message: values.net
            ? "Tutar 0'dan büyük olmalı"
            : "Saat 0'dan büyük olmalı",
        });
        return;
      }

      if (birim === "SAAT" && !values.net && deger > MESAI_MAX_SAAT) {
        ctx.addIssue({
          code: "custom",
          path: ["deger"],
          message: `Saat en fazla ${MESAI_MAX_SAAT} olabilir`,
        });
      }
    });

type MesaiForm = z.infer<ReturnType<typeof createMesaiSchema>>;

// Tarih varsayılan olarak bugün; her açılışta güncel tarih alınsın diye fonksiyon.
const getDefaultValues = (): MesaiForm => ({
  personeller: [],
  mesaiTipi: "",
  net: false,
  deger: "",
  tarih: new Date(),
});

function toFormValues(
  mesai: MesaiResponseType,
  getBirim: (mesaiTipi: string) => ReturnType<typeof getMesaiBirim>,
): MesaiForm {
  const net = Boolean(mesai.Net);
  const mesaiTipi = String(mesai.MesaiTipi ?? "");
  return {
    personeller: [String(mesai.IDSubePersonel)],
    mesaiTipi,
    net,
    deger: checkGunBrut(getBirim(mesaiTipi), net)
      ? "1"
      : String(mesai.Deger ?? ""),
    tarih: new Date(mesai.Tarih),
  };
}

const MesaiEkle = ({ open, onOpenChange, IDSube, mesai }: Props) => {
  const isEdit = Boolean(mesai);
  const { data: personelListesi = [], isLoading: isLoadingPersonel } =
    useAktifPersonelListesi();
  const { mesaiTipleri } = usePersonelSabitTanimlar();
  const { mutateAsync: insertMesai, isPending: isInserting } = useInsertMesai();
  const { mutateAsync: updateMesai, isPending: isUpdating } = useUpdateMesai();
  const isSaving = isInserting || isUpdating;

  // usePersonelSabitTanimlar her render'da yeni dizi döndürüyor; referans
  // değişince aşağıdaki reset effect'i tekrar tetiklenmesin diye içerikten
  // üretilen bir anahtara bağlıyoruz.
  const mesaiTipleriKey = mesaiTipleri
    .map((tip) => `${tip.kod}:${tip.label}`)
    .join("|");
  const mesaiTipiOptions = useMemo(
    () => toMesaiTipiOptions(mesaiTipleri),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mesaiTipleriKey],
  );

  // Kod → birim (gün/saat), mesai tipinin adından
  const getBirim = useCallback(
    (mesaiTipi: string) =>
      getMesaiBirim(
        mesaiTipiOptions.find((tip) => tip.value === mesaiTipi)?.label,
      ),
    [mesaiTipiOptions],
  );

  const mesaiSchema = useMemo(() => createMesaiSchema(getBirim), [getBirim]);

  const form = useForm<MesaiForm>({
    resolver: zodResolver(mesaiSchema),
    defaultValues: mesai ? toFormValues(mesai, getBirim) : getDefaultValues(),
  });

  // Düzenlemede mesai tipleri sonradan yüklenirse birim o an belli oluyor;
  // formu yeniden doldurmak için getBirim'e de bağlı.
  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues());
    } else if (mesai) {
      form.reset(toFormValues(mesai, getBirim));
    }
  }, [open, mesai, form, getBirim]);

  const mesaiTipi = useWatch({ control: form.control, name: "mesaiTipi" });
  const net = useWatch({ control: form.control, name: "net" });
  const birim = getBirim(mesaiTipi);
  const isGunBrut = checkGunBrut(birim, net);

  // Gün + Brüt'te gün sayısı sabit 1. Birim ya da Net/Brüt değişince eski
  // değer (örn. 1 gün → tutar) anlamsız kalacağı için alanı temizliyoruz.
  // İlk render'da (düzenleme modunda kayıtlı değer) dokunmuyoruz.
  const degerKey = `${birim ?? ""}-${net}`;
  const previousDegerKey = useRef(degerKey);
  useEffect(() => {
    if (previousDegerKey.current === degerKey) return;
    previousDegerKey.current = degerKey;
    form.setValue("deger", isGunBrut ? "1" : "", { shouldValidate: false });
  }, [degerKey, isGunBrut, form]);

  const personelOptions = useMemo(
    () =>
      personelListesi.map((p) => ({
        value: String(p.IDSubePersonel),
        label: p.AdSoyad,
        SicilNo: p.SicilNo,
      })),
    [personelListesi],
  );

  const buildParams = (values: MesaiForm) => ({
    Deger: checkGunBrut(getBirim(values.mesaiTipi), values.net)
      ? "1"
      : values.deger,
    Tarih: format(values.tarih, "yyyy-MM-dd"),
    MesaiTipi: values.mesaiTipi,
    Net: values.net,
  });

  const handleUpdate = async (
    values: MesaiForm,
    current: MesaiResponseType,
  ) => {
    try {
      const result = await updateMesai({
        IDSubePersonelMesai: current.IDSubePersonelMesai,
        IDSube: current.IDSube,
        IDSubePersonel: String(current.IDSubePersonel),
        ...buildParams(values),
      });

      if (result && Number(result.test) !== 1) {
        toast.error("Mesai güncellenemedi.");
        return;
      }

      toast.success("Mesai başarıyla güncellendi.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mesai güncellenemedi.",
      );
    }
  };

  const handleSubmit = async (values: MesaiForm) => {
    if (mesai) return handleUpdate(values, mesai);

    if (!IDSube) {
      toast.error("Lütfen önce üstten şube seçimi yapın.");
      return;
    }

    try {
      const result = await insertMesai({
        IDSube,
        IDSubePersonel: values.personeller.join("-"),
        ...buildParams(values),
      });

      if (result && Number(result.test) !== 1) {
        toast.error("Mesai oluşturulamadı.");
        return;
      }

      const eklenenSayi = result?.sayi ?? values.personeller.length;
      toast.success(
        eklenenSayi > 1
          ? `${eklenenSayi} personel için mesai oluşturuldu.`
          : "Mesai başarıyla oluşturuldu.",
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mesai oluşturulamadı.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Mesai Düzenle" : "Yeni Mesai Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mesai kaydının bilgilerini güncelleyin."
              : "Bir veya birden fazla personel seçerek mesai kaydı oluşturun."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 py-1">
            {mesai ? (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Personel</p>
                <p className="font-medium text-foreground">
                  {mesai.AdSoyad || "-"}
                </p>
                {mesai.BolumAdi && (
                  <p className="text-xs text-muted-foreground">
                    {mesai.BolumAdi}
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
              name="mesaiTipi"
              label="Mesai Tipi"
              options={mesaiTipiOptions}
              valueKey="value"
              labelKey="label"
              disabled={isSaving}
            />

            <FormSelect
              control={form.control}
              name="net"
              label="Net / Brüt"
              options={NET_OPTIONS}
              valueType="boolean"
              disabled={isSaving}
            />

            {birim &&
              (net ? (
                <FormInput
                  control={form.control}
                  name="deger"
                  label="Tutar"
                  placeholder="Mesai tutarı"
                  format="money"
                  disabled={isSaving}
                />
              ) : birim === "GUN" ? (
                <FormInput
                  control={form.control}
                  name="deger"
                  label="Gün"
                  format="number"
                  readOnly
                />
              ) : (
                <FormInput
                  control={form.control}
                  name="deger"
                  label="Saat"
                  placeholder={`En fazla ${MESAI_MAX_SAAT}`}
                  format="decimal"
                  disabled={isSaving}
                />
              ))}

            <CustomDatePicker
              control={form.control}
              name="tarih"
              label="Tarih"
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

export default MesaiEkle;
