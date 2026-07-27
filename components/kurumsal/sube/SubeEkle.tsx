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

import { useCreateSube, useUpdateSube } from "@/hooks/use-kurumsal-data";
import { subeSchema, SubeForm } from "@/schemas/kurumsal/sube.schema";
import { SubeType } from "@/types/kurumsal/sube";

// NOT: Sirket formundakiyle aynı placeholder seçenekler — gerçek il/ilçe
// listesi sonra eklenecek.
const IL_OPTIONS = [
  { label: "Ankara", value: "006" },
  { label: "İstanbul", value: "034" },
];
const ILCE_OPTIONS = [
  { label: "Keçiören", value: "79" },
  { label: "Çankaya", value: "06" },
];
const MULKIYET_OPTIONS = [
  { label: "Kendi Mülkü", value: "Kendi Mülkü" },
  { label: "Kiralık", value: "Kiralık" },
];

// Sube_Insert/Sube_UPDATEByIDSube'nin proc imzasındaki ama formda
// GÖSTERİLMEYEN alanları — şimdilik hep boş/0 gönderiliyor. Birini forma
// taşımak istersen: subeSchema'ya ekle, buradan sil, bir <FormInput/> ekle.
const ADVANCED_DEFAULTS = {
  SgkMudurlugu: "",
  IskurSifresi: "",
  BesBaslangicTarihi: "",
  BesKesintiOrani: 0,
  SifreKullaniciAdi: "",
  SifreKullaniciKodu: "",
  SifreSistem: "",
  SifreIsyeri: "",
  IsyeriTehlikeSinifi: "",
  TehlikeDerecesi: "",
  NaceKodu: "",
  NaceKoduAciklama: "",
  KodSektor: "",
  KodIsKolu: "",
  KodYSube: "",
  KodESube: "",
  KodSiraNo: "",
  KodIl: "",
  KodIlce: "",
  KodKontrolNo: "",
  KodAraci: "",
  IskurBaslangicTarihi: "",
  IskurBitisTarihi: "",
  Statu: "",
  TesvikVermeDurumu: 0,
  StopajDurum: 0,
  stIsyeriAdi: "",
  stAd: "",
  stSoyad: "",
  stVergiNo: "",
  stTcKimlikNo: "",
  stUcretTipi: "",
  stUcret: 0,
  stAdresKodu: "",
  Cizelge15: "",
  MuhasebeBirimKodu: "",
  MuhasebeBirimAdi: "",
  KurumKodu: "",
  KurumAdi: "",
  SinifKodu: "",
  DuzenleyenAdSoyad: "",
  DuzenleyenUnvan: "",
  GerceklestirenAdSoyad: "",
  GerceklestirenUnvan: "",
  IsyeriSubeKodu: "",
  IsyeriTuru: "",
  BankaKurumKodu: "",
  BankaSubeKodu: "",
  BankaHesapNo: "",
  BankaIbanNo: "",
  IDBanka: "",
};

const DEFAULT_VALUES: SubeForm = {
  SubeAdi: "",
  SubeKodu: "",
  YetkiliKisi: "",
  TcKimlikNo: "",
  Tel: "",
  CepTel: "",
  Fax: "",
  EpostaAdresi: "",
  WebAdresi: "",
  SirketAdresi: "",
  IlKodu: "",
  IlceKodu: "",
  VergiDairesi: "",
  VergiNo: "",
  IsyeriSgkSicilNumarasi: "",
  IsyeriSgkIsKoluKodu: "",
  TicaretSicilNumarasi: "",
  IskurSubesi: "",
  IskurNumarasi: "",
  IsyeriAcilisTarihi: "",
  IsyeriKapanisTarihi: "",
  Durum: true,
  MulkiyetTuru: "",
  TicaretSicilMudurluk: "",
  IsyeriFaaliyetKodu: "",
  AdresKodu: "",
};

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  /** Yeni şubenin bağlanacağı şirket — düzenleme modunda sube.IDSirket kullanılır. */
  idSirket: number;
  /** Verilirse düzenleme modu, verilmezse ekleme modu. */
  sube?: SubeType | null;
};

export default function SubeEkle({ open, onOpenChange, idSirket, sube }: Props) {
  const isEditMode = !!sube;

  const form = useForm<SubeForm>({
    resolver: zodResolver(subeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { mutateAsync: createSube, isPending: isCreating } = useCreateSube();
  const { mutateAsync: updateSube, isPending: isUpdating } = useUpdateSube();
  const isPending = isEditMode ? isUpdating : isCreating;

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (sube) {
      form.reset({
        SubeAdi: sube.SubeAdi,
        SubeKodu: sube.SubeKodu ?? "",
        YetkiliKisi: sube.YetkiliKisi ?? "",
        TcKimlikNo: sube.TcKimlikNo ?? "",
        Tel: sube.Tel ?? "",
        CepTel: sube.CepTel ?? "",
        Fax: sube.Fax ?? "",
        EpostaAdresi: sube.EpostaAdresi ?? "",
        WebAdresi: sube.WebAdresi ?? "",
        SirketAdresi: sube.SirketAdresi ?? "",
        IlKodu: sube.IlKodu ?? "",
        IlceKodu: sube.IlceKodu ?? "",
        VergiDairesi: sube.VergiDairesi ?? "",
        VergiNo: sube.VergiNo ?? "",
        IsyeriSgkSicilNumarasi: sube.IsyeriSgkSicilNumarasi ?? "",
        IsyeriSgkIsKoluKodu: sube.IsyeriSgkIsKoluKodu ?? "",
        TicaretSicilNumarasi: sube.TicaretSicilNumarasi ?? "",
        IskurSubesi: sube.IskurSubesi ?? "",
        IskurNumarasi: sube.IskurNumarasi ?? "",
        IsyeriAcilisTarihi: sube.IsyeriAcilisTarihi?.slice(0, 10) ?? "",
        IsyeriKapanisTarihi: sube.IsyeriKapanisTarihi?.slice(0, 10) ?? "",
        Durum: sube.Durum === 1,
        MulkiyetTuru: sube.MulkiyetTuru ?? "",
        TicaretSicilMudurluk: sube.TicaretSicilMudurluk ?? "",
        IsyeriFaaliyetKodu: sube.IsyeriFaaliyetKodu ?? "",
        AdresKodu: sube.AdresKodu ?? "",
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, sube, form]);

  const onSubmit = async (values: SubeForm) => {
    try {
      const payload = {
        ...ADVANCED_DEFAULTS,
        ...values,
        Durum: values.Durum ? 1 : 0,
      };

      if (isEditMode && sube) {
        await updateSube({
          IDSube: sube.IDSube,
          IDSirket: sube.IDSirket,
          ...payload,
        });
        toast.success("Şube başarıyla güncellendi.");
      } else {
        await createSube({
          IDSirket: idSirket,
          ...payload,
        });
        toast.success("Şube başarıyla oluşturuldu.");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isEditMode ? "Şube güncellenemedi." : "Şube oluşturulamadı."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Şubeyi Düzenle" : "Yeni Şube"}</DialogTitle>
          <DialogDescription>Şube bilgilerini giriniz.</DialogDescription>
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
                name="SubeAdi"
                label="Şube Adı"
                required
                placeholder="Şube adını giriniz"
              />
              <FormInput
                control={form.control}
                name="SubeKodu"
                label="Şube Kodu"
              />
              <FormInput
                control={form.control}
                name="YetkiliKisi"
                label="Yetkili Kişi"
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
              />
              <FormInput control={form.control} name="VergiNo" label="Vergi No" />
              <FormSwitch control={form.control} name="Durum" label="Durum" />
            </div>
          </section>

          {/* İletişim */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">İletişim</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput control={form.control} name="Tel" label="Telefon" />
              <FormInput
                control={form.control}
                name="CepTel"
                label="Cep Telefonu"
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
                label="Adres"
                required
                className="sm:col-span-2"
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