// app/(dashboard)/kurumsal/sirketler/[idSirket]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/forms";

import { useSirketDetay, useUpdateSirket } from "@/hooks/use-kurumsal-data";
import { sirketSchema, SirketForm } from "@/schemas/kurumsal/sirket.schema";

import Sube from "@/components/kurumsal/sube/Sube";
import { SirketFormFields } from "@/components/kurumsal/sirket/SirketFormFields";

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

export default function SirketDetayPage() {
  const params = useParams<{ idSirket: string }>();
  const router = useRouter();
  const idSirket = Number(params.idSirket);

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
      VergiDairesi: sirket.VergiDairesi ?? "",
      VergiNo: sirket.VergiNo ?? "",
      Tel: sirket.Tel ?? "",
      CepTel: sirket.CepTel ?? "",
      Fax: sirket.Fax ?? "",
      EpostaAdresi: sirket.EpostaAdresi ?? "",
      WebAdresi: sirket.WebAdresi ?? "",
      SirketAdresi: sirket.SirketAdresi ?? "",
      Ulke: sirket.Ulke ?? "Türkiye",
      IlKodu: sirket.IlKodu ?? "",
      IlceKodu: sirket.IlceKodu ?? "",
      PostaKodu: sirket.PostaKodu ?? "",
      IsyeriSgkSicilNumarasi: sirket.IsyeriSgkSicilNumarasi ?? "",
      IsyeriSgkIsKoluKodu: sirket.IsyeriSgkIsKoluKodu ?? "",
      TicaretSicilNumarasi: sirket.TicaretSicilNumarasi ?? "",
      MersisNumarasi: sirket.MersisNumarasi ?? "",
      IskurSubesi: sirket.IskurSubesi ?? "",
      IskurNumarasi: sirket.IskurNumarasi ?? "",
      IsyeriAcilisTarihi: sirket.IsyeriAcilisTarihi?.slice(0, 10) ?? "",
      IsyeriKapanisTarihi: sirket.IsyeriKapanisTarihi?.slice(0, 10) ?? "",
      Durum: sirket.Durum === 1,
      MulkiyetTuru: sirket.MulkiyetTuru ?? "",
      TicaretSicilMudurluk: sirket.TicaretSicilMudurluk ?? "",
      IsyeriFaaliyetKodu: sirket.IsyeriFaaliyetKodu ?? "",
      AdresKodu: sirket.AdresKodu ?? "",
      SirketTip: sirket.SirketTip ?? "",
      ServisPassword: sirket.ServisPassword ?? "",
      ServisAktif: sirket.ServisAktif === 1,
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
    } catch (error: any) {
      toast.error(error?.message || "Şirket güncellenemedi.");
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
    return (
      <div className="space-y-4">
        <Button
          type="button"
          color="secondary"
          appearance="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Geri
        </Button>
        <p className="text-sm text-destructive">Şirket bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            color="secondary"
            appearance="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {sirket.SirketAdi}
            </h1>
            <p className="text-sm text-muted-foreground">
              Şirket bilgilerini görüntüle ve düzenle
            </p>
          </div>
        </div>
      </div>

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

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Şubeler</h2>
        <Sube idSirket={idSirket} />
      </div>
    </div>
  );
}
