"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormInput, FormSelect, FormSwitch } from "@/components/forms";
import {
  useCreatePersonel,
  usePersonelDetay,
  useUpdatePersonel,
} from "@/hooks/use-personel";
import { useIlceler, useIller } from "@/hooks/use-il-ilce-vergi-data";
import { PERSONEL_DEFAULT_VALUES, PersonelForm } from "./PersonelFormType";
import { useSabitTanimlar } from "@/hooks/use-sabit-tanimlar";
import { toast } from "sonner";
import { useCurrentContext } from "@/hooks/use-context";
import { PersonelFormFields } from "./PersonelFormFields";



type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse düzenleme modu — o personelin bilgileri çekilip forma yansıtılır. */
  id?: string | number | null;
  idSube?: string | number;
  idBolum?: string | number;
};

export default function PersonelEkle({
  open,
  onOpenChange,
  id,
  idSube,
  idBolum,
}: Props) {
  const isEditMode = Boolean(id);

  const {
    data: personel,
    isLoading,
    isError,
  } = usePersonelDetay(open && isEditMode ? (id ?? undefined) : undefined);
  const { data: context } = useCurrentContext();
  const form = useForm<PersonelForm>({
    defaultValues: PERSONEL_DEFAULT_VALUES,
  });

  // Veri gelince (ya da modal kapanınca) formu doldur/sıfırla.
  useEffect(() => {
    if (!open) {
      form.reset(PERSONEL_DEFAULT_VALUES);
      return;
    }

    if (isEditMode && personel) {
      form.reset({
        SicilNo: personel.SicilNo ?? "",
        TcKimlikNo: personel.TcKimlikNo ?? "",
        Ad: personel.Ad ?? "",
        Soyad: personel.Soyad ?? "",
        IlkSoyad: personel.IlkSoyad ?? "",
        Cinsiyet: personel.Cinsiyet ?? "",
        DogumTarihi: personel.DogumTarihi?.slice(0, 10) ?? "",
        DogumYeri: personel.DogumYeri ?? "",
        MedeniDurum: personel.MedeniDurum ?? "",
        Uyruk: personel.Uyruk ?? "",
        KanGurubu: personel.KanGurubu ?? "",
        OgrenimDurumu: personel.OgrenimDurumu ?? "51",
        MezuniyetYili: personel.MezuniyetYili ?? "",
        MezuniyetBolumu: personel.MezuniyetBolumu ?? "",
        Boy: personel.Boy != null ? String(personel.Boy) : "",
        Kilo: personel.Kilo != null ? String(personel.Kilo) : "",
        Yas: personel.Yas != null ? String(personel.Yas) : "",
        KimlikKartiSeriNo: personel.KimlikKartiSeriNo ?? "",
        KimlikKartiDuzenlemeTarihi:
          personel.KimlikKartiDuzenlemeTarihi?.slice(0, 10) ?? "",
        KimlikKartiBitisTarihi:
          personel.KimlikKartiBitisTarihi?.slice(0, 10) ?? "",
        OzurluDurumu: Boolean(personel.OzurluDurumu),
        OzurlulukDerecesi:
          personel.OzurlulukDerecesi != null
            ? String(personel.OzurlulukDerecesi)
            : "",
        Aciklama: personel.Aciklama ?? "",

        IseIlkGirisTarihi: personel.IseIlkGirisTarihi?.slice(0, 10) ?? "",
        IseSonGirisTarihi: personel.IseSonGirisTarihi?.slice(0, 10) ?? "",
        CikisTarihi: personel.CikisTarihi?.slice(0, 10) ?? "",
        Durum: Boolean(personel.Durum),
        SgkDurumu: personel.SgkDurumu != null ? String(personel.SgkDurumu) : "",
        IstihdamDurumu:
          personel.IstihdamDurumu != null
            ? String(personel.IstihdamDurumu)
            : "",
        CalismaDurumu:
          personel.CalismaDurumu != null ? String(personel.CalismaDurumu) : "",
        PersonelAyrilisKodu: personel.PersonelAyrilisKodu ?? "",
        IDPersonelIstisnaDurum:
          personel.IDPersonelIstisnaDurum != null
            ? String(personel.IDPersonelIstisnaDurum)
            : "",
        IstisnaDurumBilgi: personel.IstisnaDurumBilgi ?? "",
        IstisnaDurumTarih: personel.IstisnaDurumTarih?.slice(0, 10) ?? "",
        IskurKayit: Boolean(personel.IskurKayit),
        IskurKayitNo: personel.IskurKayitNo ?? "",
        AzCalismaDurumu: Boolean(personel.AzCalismaDurumu),
        AzCalismaDurumuGun: Boolean(personel.AzCalismaDurumuGun),
        AzCalismaDurumuGunSayisi:
          personel.AzCalismaDurumuGunSayisi != null
            ? String(personel.AzCalismaDurumuGunSayisi)
            : "",
        EskiHukumluDurumu: Boolean(personel.EskiHukumluDurumu),
        SendikaDurumu: Boolean(personel.SendikaDurumu),
        SendikaBaslangicTarihi:
          personel.SendikaBaslangicTarihi?.slice(0, 10) ?? "",
        DayanismaDurumu: Boolean(personel.DayanismaDurumu),
        DayanismaBaslangicTarihi:
          personel.DayanismaBaslangicTarihi?.slice(0, 10) ?? "",
        GecmistenKalanIzinGun:
          personel.GecmistenKalanIzinGun != null
            ? String(personel.GecmistenKalanIzinGun)
            : "",

        Ucret: personel.Ucret != null ? String(personel.Ucret) : "",
        MaasParaBirimi:
          personel.MaasParaBirimi != null
            ? String(personel.MaasParaBirimi)
            : "",
        OdemeSekli:
          personel.OdemeSekli != null ? String(personel.OdemeSekli) : "",
        UcretTipi: personel.UcretTipi != null ? String(personel.UcretTipi) : "",
        GunlukUcret:
          personel.GunlukUcret != null ? String(personel.GunlukUcret) : "",
        SaatlikUcret:
          personel.SaatlikUcret != null ? String(personel.SaatlikUcret) : "",
        SozlesmeUcret:
          personel.SozlesmeUcret != null ? String(personel.SozlesmeUcret) : "",
        SozlesmeOdemeSekli:
          personel.SozlesmeOdemeSekli != null
            ? String(personel.SozlesmeOdemeSekli)
            : "",
        SozlesmeUcret2:
          personel.SozlesmeUcret2 != null
            ? String(personel.SozlesmeUcret2)
            : "",
        SozlesmeOdemeSekli2:
          personel.SozlesmeOdemeSekli2 != null
            ? String(personel.SozlesmeOdemeSekli2)
            : "",
        Ucret2: personel.Ucret2 != null ? String(personel.Ucret2) : "",
        GunlukUcret2:
          personel.GunlukUcret2 != null ? String(personel.GunlukUcret2) : "",
        SaatlikUcret2:
          personel.SaatlikUcret2 != null ? String(personel.SaatlikUcret2) : "",
        NetUcret: personel.NetUcret != null ? String(personel.NetUcret) : "",
        AgiAlmazDurumu: Boolean(personel.AgiAlmazDurumu),
        AgiOrani: personel.AgiOrani != null ? String(personel.AgiOrani) : "",
        AgiOranID: personel.AgiOranID != null ? String(personel.AgiOranID) : "",
        BesKesilmezDurumu: Boolean(personel.BesKesilmezDurumu),
        BesOrani: personel.BesOrani != null ? String(personel.BesOrani) : "",
        DevredenSgkMatrahi:
          personel.DevredenSgkMatrahi != null
            ? String(personel.DevredenSgkMatrahi)
            : "",
        KumulatifSgkMatrahi:
          personel.KumulatifSgkMatrahi != null
            ? String(personel.KumulatifSgkMatrahi)
            : "",
        AuKumulatifVergiMatrahi:
          personel.AuKumulatifVergiMatrahi != null
            ? String(personel.AuKumulatifVergiMatrahi)
            : "",
        TesvikOrani:
          personel.TesvikOrani != null ? String(personel.TesvikOrani) : "",
        VergidenMuaf: Boolean(personel.VergidenMuaf),
        YardimHaric: Boolean(personel.YardimHaric),
        AgiHaric: Boolean(personel.AgiHaric),
        MaliMesuliyet: Boolean(personel.MaliMesuliyet),
        CocukYardimiAlamaz: Boolean(personel.CocukYardimiAlamaz),
        BordroIstisnaUygulama: Boolean(personel.BordroIstisnaUygulama),
        UcretOtomatikIsle: Boolean(personel.UcretOtomatikIsle),
        UcretOdemeGun:
          personel.UcretOdemeGun != null ? String(personel.UcretOdemeGun) : "",
        HastalikRiskPrimDurumu: Boolean(personel.HastalikRiskPrimDurumu),
        AsgeriUcretli: Boolean(personel.AsgeriUcretli),
        IDBanka: personel.IDBanka != null ? String(personel.IDBanka) : "",
        BankaSubeKodu: personel.BankaSubeKodu ?? "",
        BankaHesapNo: personel.BankaHesapNo ?? "",
        BankaIbanNo: personel.BankaIbanNo ?? "",
        PersonelMeslekKodu: personel.PersonelMeslekKodu ?? "",
        PersonelSgkBelgeTuru: personel.PersonelSgkBelgeTuru ?? "",
        PersonelKanunNo: personel.PersonelKanunNo ?? "",
        PersonelGorevKodu:
          personel.PersonelGorevKodu != null
            ? String(personel.PersonelGorevKodu)
            : "",
        PersonelSigortaKolu: personel.PersonelSigortaKolu ?? "",
        GorevAdi: personel.GorevAdi ?? "",
        UnvanAdi: personel.UnvanAdi ?? "",
        OzelKod: personel.OzelKod ?? "",
        OzelKod2: personel.OzelKod2 ?? "",
        VardiyaliCalismaDurumu: Boolean(personel.VardiyaliCalismaDurumu),
        Adres: personel.Adres ?? "",
        Telefon: personel.Telefon ?? "",
        IlKodu: personel.IlKodu ?? "",
        IlceKodu: personel.IlceKodu ?? "",
        IDLokasyon: personel.IDLokasyon ?? "",
        Koordinatorluk: personel.Koordinatorluk ?? "",
        CalismaAlani: personel.CalismaAlani ?? "",
      });
    } else {
      form.reset(PERSONEL_DEFAULT_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, personel]);

  const { mutateAsync: createPersonel, isPending: isCreating } =
    useCreatePersonel();
  const { mutateAsync: updatePersonel, isPending: isUpdating } =
    useUpdatePersonel();
  const isSaving = isEditMode ? isUpdating : isCreating;

  const handleSubmit = async (values: PersonelForm) => {
    try {
      if (isEditMode && personel) {
        await updatePersonel({
          ...values,
          IDSubePersonel: personel.IDSubePersonel,
          IDSube: personel.IDSube,
          IDBolum: personel.IDBolum,
        });
        toast.success("Personel başarıyla güncellendi.");
      } else {
        await createPersonel({
          ...values,
          IDSube: context?.IDSube,
          IDBolum: context?.IDBolum ?? "",
        });
        toast.success("Personel başarıyla oluşturuldu.");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isEditMode
            ? "Personel güncellenemedi."
            : "Personel oluşturulamadı."),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Personel Detayı" : "Yeni Personel Ekle"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Kod alanlarının seçenek listeleri (Medeni Durum, Uyruk vb.) yakında eklenecek — şimdilik kaydın mevcut kodu tek seçenek olarak görünüyor."
              : "Yeni personel bilgilerini girin ve kaydedin."}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : isEditMode && isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            Personel bilgileri getirilemedi.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <PersonelFormFields
              control={form.control}
              setValue={form.setValue}
              personel={personel}
            />

            <DialogFooter>
              <Button
                type="button"
                appearance="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
