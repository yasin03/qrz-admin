"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { FormSubmitButton } from "@/components/forms";
import { useSirketDetay, useUpdateSirket } from "@/hooks/use-kurumsal-data";
import { sirketSchema, SirketForm } from "@/schemas/kurumsal/sirket.schema";
import { SirketFormFields } from "./SirketFormFields";

const DEFAULT_VALUES: SirketForm = {
  SirketAdi: "",
  YetkiliKisi: "",
  Adi: "",
  Soyadi: "",
  TcKimlikNo: "",
  VergiDairesi: "",
  VergiNo: "",
  Tel: "",
  CepTel: "",
  Fax: "",
  EpostaAdresi: "",
  WebAdresi: "",
  SirketAdresi: "",
  Ulke: "Türkiye",
  IlKodu: "",
  IlceKodu: "",
  PostaKodu: "",
  IsyeriSgkSicilNumarasi: "",
  IsyeriSgkIsKoluKodu: "",
  TicaretSicilNumarasi: "",
  MersisNumarasi: "",
  IskurSubesi: "",
  IskurNumarasi: "",
  IsyeriAcilisTarihi: "",
  IsyeriKapanisTarihi: "",
  Durum: true,
  MulkiyetTuru: "",
  TicaretSicilMudurluk: "",
  IsyeriFaaliyetKodu: "",
  AdresKodu: "",
  SirketTip: "",
  ServisPassword: "",
  ServisAktif: false,
};

type SirketDetayFormProps = {
  idSirket: number;
};

// Şirket bilgilerini getirip düzenleme formunu gösterir. Hem
// /kurumsal/sirketler/[idSirket] hem de Ayarlar > Kurumsal Yönetim >
// Şirket Bilgileri sayfasında kullanılıyor.
export function SirketDetayForm({ idSirket }: SirketDetayFormProps) {
  const { data: sirket, isLoading, isError } = useSirketDetay(idSirket);
  const { mutateAsync: updateSirket, isPending } = useUpdateSirket();

  const form = useForm<SirketForm>({
    resolver: zodResolver(sirketSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Veri gelince (veya idSirket değişince) formu doldur.
  useEffect(() => {
    if (!sirket) return;

    form.reset({
      SirketAdi: sirket.SirketAdi,
      YetkiliKisi: sirket.YetkiliKisi ?? "",
      Adi: sirket.Adi ?? "",
      Soyadi: sirket.Soyadi ?? "",
      TcKimlikNo: sirket.TcKimlikNo ?? "",
      VergiDairesi: String(sirket.VergiDairesi ?? ""),
      VergiNo: sirket.VergiNo ?? "",
      Tel: sirket.Tel ?? "",
      CepTel: sirket.CepTel ?? "",
      Fax: sirket.Fax ?? "",
      EpostaAdresi: sirket.EpostaAdresi ?? "",
      WebAdresi: sirket.WebAdresi ?? "",
      SirketAdresi: sirket.SirketAdresi ?? "",
      Ulke: sirket.Ulke ?? "Türkiye",
      IlKodu: String(sirket.IlKodu ?? ""),
      IlceKodu: String(sirket.IlceKodu ?? ""),
      PostaKodu: sirket.PostaKodu ?? "",
      IsyeriSgkSicilNumarasi: sirket.IsyeriSgkSicilNumarasi ?? "",
      IsyeriSgkIsKoluKodu: sirket.IsyeriSgkIsKoluKodu ?? "",
      TicaretSicilNumarasi: sirket.TicaretSicilNumarasi ?? "",
      MersisNumarasi: sirket.MersisNumarasi ?? "",
      IskurSubesi: sirket.IskurSubesi ?? "",
      IskurNumarasi: sirket.IskurNumarasi ?? "",
      IsyeriAcilisTarihi: sirket.IsyeriAcilisTarihi?.slice(0, 10) ?? "",
      IsyeriKapanisTarihi: sirket.IsyeriKapanisTarihi?.slice(0, 10) ?? "",
      Durum: Boolean(sirket.Durum),
      MulkiyetTuru: String(sirket.MulkiyetTuru ?? ""),
      TicaretSicilMudurluk: sirket.TicaretSicilMudurluk ?? "",
      IsyeriFaaliyetKodu: sirket.IsyeriFaaliyetKodu ?? "",
      AdresKodu: sirket.AdresKodu ?? "",
      SirketTip: String(sirket.SirketTip ?? ""),
      ServisPassword: sirket.ServisPassword ?? "",
      ServisAktif: Boolean(sirket.ServisAktif),
    });
  }, [sirket, form]);

  const onSubmit = async (values: SirketForm) => {
    if (!sirket) return;

    try {
      await updateSirket({
        IDSirket: sirket.IDSirket,
        IDGurup: sirket.IDGurup,
        ...values,
        Durum: values.Durum ? 1 : 0,
        ServisAktif: values.ServisAktif ? 1 : 0,
      });
      toast.success("Şirket başarıyla güncellendi.");
    } catch (error) {
      toast.error((error as { message?: string })?.message || "Şirket güncellenemedi.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (isError || !sirket) {
    return <p className="text-sm text-destructive">Şirket bulunamadı.</p>;
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-border bg-card p-5"
    >
      <SirketFormFields control={form.control} setValue={form.setValue} />

      <div className="flex justify-end border-t border-border pt-4">
        <FormSubmitButton loading={isPending}>
          <Save className="size-4" />
          Kaydet
        </FormSubmitButton>
      </div>
    </form>
  );
}
