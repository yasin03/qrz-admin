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

import {
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormSwitch,
} from "@/components/forms";

import { useCreateSirket, useUpdateSirket } from "@/hooks/use-kurumsal-data";
import { sirketSchema, SirketForm } from "@/schemas/kurumsal/sirket.schema";
import { SirketType } from "@/types/kurumsal/sirket";

// NOT: Gerçek il/ilçe listesi (ve birbirine bağlı filtreleme) sonra eklenecek.
// Şimdilik sabit 2 seçenek.
const IL_OPTIONS = [
  { label: "Ankara", value: "06" },
  { label: "İstanbul", value: "034" },
];
const ILCE_OPTIONS = [
  { label: "Keçiören", value: "79" },
  { label: "Çankaya", value: "06" },
];
const SIRKET_TIP_OPTIONS = [
  { label: "Şirket", value: "ŞİRKET" },
  { label: "Şahıs", value: "ŞAHIS" },
];
const MULKIYET_OPTIONS = [
  { label: "Kendi Mülkü", value: "1" },
  { label: "Kiralık", value: "2" },
];

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
  /** Verilirse düzenleme modu, verilmezse ekleme modu. */
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
      console.error("Şirket kaydetme hatası:", error);
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
          {/* Temel Bilgiler */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Temel Bilgiler
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="SirketAdi"
                label="Şirket Adı"
                required
                placeholder="Şirket adını giriniz"
              />
              <FormInput
                control={form.control}
                name="YetkiliKisi"
                label="Yetkili Kişi"
                placeholder="Yetkili kişi"
              />
              <FormSelect
                control={form.control}
                name="SirketTip"
                label="Şirket Tipi"
                options={SIRKET_TIP_OPTIONS}
              />
              <FormSelect
                control={form.control}
                name="MulkiyetTuru"
                label="Mülkiyet Türü"
                options={MULKIYET_OPTIONS}
              />
              <FormInput
                control={form.control}
                name="VergiDairesi"
                label="Vergi Dairesi"
                required
                placeholder="Vergi dairesi"
              />
              <FormInput
                control={form.control}
                name="VergiNo"
                label="Vergi No"
                required
                placeholder="Vergi no"
              />
              <FormSwitch control={form.control} name="Durum" label="Durum" />
            </div>
          </section>

          {/* Şahıs Bilgileri */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Şahıs Bilgileri (opsiyonel)
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormInput control={form.control} name="Adi" label="Adı" />
              <FormInput control={form.control} name="Soyadi" label="Soyadı" />
              <FormInput
                control={form.control}
                name="TcKimlikNo"
                label="TC Kimlik No"
              />
            </div>
          </section>

          {/* İletişim */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">İletişim</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="Tel"
                label="Telefon"
                placeholder="0xxx xxx xx xx"
              />
              <FormInput
                control={form.control}
                name="CepTel"
                label="Cep Telefonu"
                placeholder="05xx xxx xx xx"
              />
              <FormInput control={form.control} name="Fax" label="Faks" />
              <FormInput
                control={form.control}
                name="EpostaAdresi"
                label="E-posta"
                placeholder="ornek@sirket.com"
              />
              <FormInput
                control={form.control}
                name="WebAdresi"
                label="Web Adresi"
              />
            </div>
          </section>

          {/* Adres */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Adres</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="SirketAdresi"
                label="Şirket Adresi"
                required
                className="sm:col-span-2"
              />
              <FormInput
                control={form.control}
                name="Ulke"
                label="Ülke"
                required
              />
              <FormSelect
                control={form.control}
                name="IlKodu"
                label="İl"
                options={IL_OPTIONS}
              />
              <FormSelect
                control={form.control}
                name="IlceKodu"
                label="İlçe"
                options={ILCE_OPTIONS}
              />
              <FormInput
                control={form.control}
                name="PostaKodu"
                label="Posta Kodu"
              />
              <FormInput
                control={form.control}
                name="AdresKodu"
                label="Adres Kodu"
              />
            </div>
          </section>

          {/* Resmi Kayıtlar */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Resmi Kayıtlar (opsiyonel)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="IsyeriSgkSicilNumarasi"
                label="İşyeri SGK Sicil No"
              />
              <FormInput
                control={form.control}
                name="IsyeriSgkIsKoluKodu"
                label="İşyeri SGK İş Kolu Kodu"
              />
              <FormInput
                control={form.control}
                name="TicaretSicilNumarasi"
                label="Ticaret Sicil No"
              />
              <FormInput
                control={form.control}
                name="MersisNumarasi"
                label="Mersis No"
              />
              <FormInput
                control={form.control}
                name="TicaretSicilMudurluk"
                label="Ticaret Sicil Müdürlüğü"
              />
              <FormInput
                control={form.control}
                name="IsyeriFaaliyetKodu"
                label="İşyeri Faaliyet Kodu"
              />
              <FormInput
                control={form.control}
                name="IskurSubesi"
                label="İşkur Şubesi"
              />
              <FormInput
                control={form.control}
                name="IskurNumarasi"
                label="İşkur Numarası"
              />
            </div>
          </section>

          {/* Tarihler */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tarihler</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="IsyeriAcilisTarihi"
                label="İşyeri Açılış Tarihi"
                type="date"
                required
              />
              <FormInput
                control={form.control}
                name="IsyeriKapanisTarihi"
                label="İşyeri Kapanış Tarihi"
                type="date"
              />
            </div>
          </section>

          {/* Servis */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Servis (opsiyonel)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="ServisPassword"
                label="Servis Şifresi"
                type="password"
              />
              <FormSwitch
                control={form.control}
                name="ServisAktif"
                label="Servis Aktif"
              />
            </div>
          </section>

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
