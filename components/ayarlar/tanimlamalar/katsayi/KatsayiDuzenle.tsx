"use client";

import { useEffect, useMemo } from "react";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect, FormSwitch } from "@/components/forms";
import { useUpdateKatsayi } from "@/hooks/use-katsayi";
import { KatsayiType } from "@/types/ayarlar/katsayi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  katsayi: KatsayiType | null;
};

const TIPI_OPTIONS = [ "Ödeme", "Kesinti", "İndirim"];
const ODEME_SEKLI_OPTIONS = ["Gün", "Saat", "Sicil", "Tutar"];
const NET_BRUT_OPTIONS = ["Brüt", "Net", "Sicil"];

/** Kayıttaki değer sabit listede yoksa (DB'de farklı bir değer varsa) seçeneklere ekler. */
const toOptions = (values: string[], current?: string | null) => {
  const list =
    current && !values.includes(current) ? [...values, current] : values;
  return list.map((value) => ({ value, label: value }));
};

/** Boş, geçersiz ya da sıfır ("0.00", "0,", "") değerleri API'ye "0" olarak gönderir. */
const toApiDecimal = (value: string) => {
  const numeric = Number(value);
  return !value || Number.isNaN(numeric) || numeric === 0 ? "0" : value;
};

const toDecimalString = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? "" : String(value);

const toBit = (value: boolean): 0 | 1 => (value ? 1 : 0);

const toBool = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

const katsayiSchema = z.object({
  Tipi: z.string().trim().min(1, "Tipi seçiniz"),
  SahaAciklama: z.string().trim().min(1, "Açıklama giriniz"),
  OdemeSekli: z.string().trim().min(1, "Ödeme şekli seçiniz"),
  NetBrut: z.string().trim().min(1, "Net/Brüt seçiniz"),
  Katsayi: z.string(),
  MinimumDeger: z.string(),
  MaksimumDeger: z.string(),
  SskMuafiyeti: z.string(),
  VergiMuafiyeti: z.string(),
  SgkUygulamaDurum: z.boolean(),
  VergiUygulamaDurum: z.boolean(),
  DamgaUygulamaDurum: z.boolean(),
  SendikaliOdeme: z.boolean(),
  SendikasizOdeme: z.boolean(),
});

type KatsayiForm = z.infer<typeof katsayiSchema>;

const DEFAULT_VALUES: KatsayiForm = {
  Tipi: "",
  SahaAciklama: "",
  OdemeSekli: "",
  NetBrut: "",
  Katsayi: "",
  MinimumDeger: "",
  MaksimumDeger: "",
  SskMuafiyeti: "",
  VergiMuafiyeti: "",
  SgkUygulamaDurum: false,
  VergiUygulamaDurum: false,
  DamgaUygulamaDurum: false,
  SendikaliOdeme: false,
  SendikasizOdeme: false,
};

const KatsayiDuzenle = ({ open, onOpenChange, katsayi }: Props) => {
  const { mutateAsync: updateKatsayi, isPending: isSaving } =
    useUpdateKatsayi();

  const form = useForm<KatsayiForm>({
    resolver: zodResolver(katsayiSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open || !katsayi) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    form.reset({
      Tipi: katsayi.Tipi ?? "",
      SahaAciklama: katsayi.SahaAciklama ?? "",
      OdemeSekli: katsayi.OdemeSekli ?? "",
      NetBrut: katsayi.NetBrut ?? "",
      Katsayi: toDecimalString(katsayi.Katsayi),
      MinimumDeger: toDecimalString(katsayi.MinimumDeger),
      MaksimumDeger: toDecimalString(katsayi.MaksimumDeger),
      SskMuafiyeti: toDecimalString(katsayi.SskMuafiyeti),
      VergiMuafiyeti: toDecimalString(katsayi.VergiMuafiyeti),
      SgkUygulamaDurum: toBool(katsayi.SgkUygulamaDurum),
      VergiUygulamaDurum: toBool(katsayi.VergiUygulamaDurum),
      DamgaUygulamaDurum: toBool(katsayi.DamgaUygulamaDurum),
      SendikaliOdeme: toBool(katsayi.SendikaliOdeme),
      SendikasizOdeme: toBool(katsayi.SendikasizOdeme),
    });
  }, [open, katsayi, form]);

  const tipiOptions = useMemo(
    () => toOptions(TIPI_OPTIONS, katsayi?.Tipi),
    [katsayi],
  );
  const odemeSekliOptions = useMemo(
    () => toOptions(ODEME_SEKLI_OPTIONS, katsayi?.OdemeSekli),
    [katsayi],
  );
  const netBrutOptions = useMemo(
    () => toOptions(NET_BRUT_OPTIONS, katsayi?.NetBrut),
    [katsayi],
  );

  const handleSubmit = async (values: KatsayiForm) => {
    if (!katsayi) return;

    try {
      const result = await updateKatsayi({
        IDSubeTahakkukSaha: katsayi.IDSubeTahakkukSaha,
        Tipi: values.Tipi,
        SahaAciklama: values.SahaAciklama,
        OdemeSekli: values.OdemeSekli,
        NetBrut: values.NetBrut,
        Katsayi: toApiDecimal(values.Katsayi),
        MinimumDeger: toApiDecimal(values.MinimumDeger),
        MaksimumDeger: toApiDecimal(values.MaksimumDeger),
        SskMuafiyeti: toApiDecimal(values.SskMuafiyeti),
        VergiMuafiyeti: toApiDecimal(values.VergiMuafiyeti),
        SgkUygulamaDurum: toBit(values.SgkUygulamaDurum),
        VergiUygulamaDurum: toBit(values.VergiUygulamaDurum),
        DamgaUygulamaDurum: toBit(values.DamgaUygulamaDurum),
        SendikaliOdeme: toBit(values.SendikaliOdeme),
        SendikasizOdeme: toBit(values.SendikasizOdeme),
      });

      if (result?.test !== undefined && Number(result.test) !== 1) {
        toast.error("Katsayı güncellenemedi.");
        return;
      }

      toast.success("Katsayı güncellendi.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Katsayı güncellenemedi.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Katsayı Düzenle</DialogTitle>
          <DialogDescription>
            {katsayi?.SahaAciklama
              ? `"${katsayi.SahaAciklama}" sahasının katsayı ve uygulama bilgilerini güncelleyiniz.`
              : "Katsayı ve uygulama bilgilerini güncelleyiniz."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <div className="grid gap-x-6 gap-y-3 py-1 sm:grid-cols-2">
            <FormInput
              control={form.control}
              name="SahaAciklama"
              label="Saha Açıklama"
              disabled={isSaving}
              className="sm:col-span-2"
            />
            <FormSelect
              control={form.control}
              name="Tipi"
              label="Tipi"
              options={tipiOptions}
              disabled={isSaving}
            />
            <FormSelect
              control={form.control}
              name="OdemeSekli"
              label="Ödeme Şekli"
              options={odemeSekliOptions}
              disabled={isSaving}
            />
            <FormSelect
              control={form.control}
              name="NetBrut"
              label="Net/Brüt"
              options={netBrutOptions}
              disabled={isSaving}
            />
            <FormInput
              control={form.control}
              name="Katsayi"
              label="Katsayı"
              format="decimal"
              disabled={isSaving}
            />
            <FormInput
              control={form.control}
              name="MinimumDeger"
              label="Minimum Değer"
              format="money"
              disabled={isSaving}
            />
            <FormInput
              control={form.control}
              name="MaksimumDeger"
              label="Maksimum Değer"
              format="money"
              disabled={isSaving}
            />
            <FormInput
              control={form.control}
              name="SskMuafiyeti"
              label="SSK Muafiyeti"
              format="money"
              disabled={isSaving}
            />
            <FormInput
              control={form.control}
              name="VergiMuafiyeti"
              label="Vergi Muafiyeti"
              format="money"
              disabled={isSaving}
            />
          </div>

          <div className="grid gap-x-6 gap-y-3 border-t border-border pt-3 sm:grid-cols-2">
            <FormSwitch
              control={form.control}
              name="SgkUygulamaDurum"
              label="SGK Uygulansın"
              disabled={isSaving}
            />
            <FormSwitch
              control={form.control}
              name="VergiUygulamaDurum"
              label="Vergi Uygulansın"
              disabled={isSaving}
            />
            <FormSwitch
              control={form.control}
              name="DamgaUygulamaDurum"
              label="Damga Uygulansın"
              disabled={isSaving}
            />
            <FormSwitch
              control={form.control}
              name="SendikaliOdeme"
              label="Sendikalı Ödeme"
              disabled={isSaving}
            />
            <FormSwitch
              control={form.control}
              name="SendikasizOdeme"
              label="Sendikasız Ödeme"
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
              {isSaving ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default KatsayiDuzenle;
