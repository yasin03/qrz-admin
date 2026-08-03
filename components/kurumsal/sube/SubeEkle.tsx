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

import { useCreateSube, useUpdateSube } from "@/hooks/use-kurumsal-data";
import { subeSchema, SubeForm } from "@/schemas/kurumsal/sube.schema";
import { SubeType } from "@/types/kurumsal/sube";
import { SubeFormFields } from "./SubeFormFields";
import { format } from "date-fns";

// Sube_Insert/Sube_UPDATEByIDSube proc imzasındaki ama formda GÖSTERİLMEYEN
// alanlar — bkz. SubeFormFields yorumları. Birini forma taşımak istersen
// subeSchema'ya ekle, buradan sil, SubeFormFields'e bir <FormInput/> ekle.
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
  Ulke: "Türkiye",
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
  idSirket: number;
  sube?: SubeType | null;
};

export default function SubeEkle({
  open,
  onOpenChange,
  idSirket,
  sube,
}: Props) {
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
        Ulke: sube.Ulke ?? "Türkiye",
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
      form.reset({
        ...DEFAULT_VALUES,
        IsyeriAcilisTarihi: format(new Date(), "yyyy-MM-dd"),
      });
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
          <DialogTitle>
            {isEditMode ? "Şubeyi Düzenle" : "Yeni Şube"}
          </DialogTitle>
          <DialogDescription>Şube bilgilerini giriniz.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SubeFormFields control={form.control} setValue={form.setValue}/>

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
