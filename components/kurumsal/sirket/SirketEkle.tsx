"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { FormSubmitButton } from "@/components/forms";

import { useCreateSirket, useUpdateSirket } from "@/hooks/use-kurumsal-data";
import { sirketSchema, SirketForm } from "@/schemas/kurumsal/sirket.schema";
import { SirketType } from "@/types/kurumsal/sirket";
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

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  /** Yeni şirketin bağlanacağı grup — düzenleme modunda sirket.IDGurup kullanılır. */
  idGurup: number;
  /**
   * Verilirse düzenleme modu. NOT: Artık asıl düzenleme akışı satıra
   * tıklayınca açılan /kurumsal/sirketler/[idSirket] sayfası — burası
   * hâlâ çalışıyor ama liste/grup satırından hızlı düzenleme istemiyorsan
   * bu prop'u hiç kullanmayabilirsin.
   */
  sirket?: SirketType | null;
};

export default function SirketEkle({
  open,
  onOpenChange,
  idGurup,
  sirket,
}: Props) {
  const isEditMode = !!sirket;

  const form = useForm<SirketForm>({
    resolver: zodResolver(sirketSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { mutateAsync: createSirket, isPending: isCreating } =
    useCreateSirket();
  const { mutateAsync: updateSirket, isPending: isUpdating } =
    useUpdateSirket();
  const isPending = isEditMode ? isUpdating : isCreating;

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (sirket) {
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
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, sirket, form]);

  const onSubmit = async (values: SirketForm) => {
    try {
      const payload = {
        ...values,
        Durum: values.Durum ? 1 : 0,
        ServisAktif: values.ServisAktif ? 1 : 0,
      };

      if (isEditMode && sirket) {
        await updateSirket({
          IDSirket: sirket.IDSirket,
          IDGurup: sirket.IDGurup,
          ...payload,
        });
        toast.success("Şirket başarıyla güncellendi.");
      } else {
        await createSirket({
          IDGurup: idGurup,
          ...payload,
        });
        toast.success("Şirket başarıyla oluşturuldu.");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isEditMode ? "Şirket güncellenemedi." : "Şirket oluşturulamadı."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Şirketi Düzenle" : "Yeni Şirket"}
          </DialogTitle>
          <DialogDescription>Şirket bilgilerini giriniz.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SirketFormFields control={form.control} />

          <DialogFooter>
            <Button
              type="button"
              appearance="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>

            <FormSubmitButton loading={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}