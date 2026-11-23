"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

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
  useCreatePersonel,
  usePersonelDetay,
  useUpdatePersonel,
} from "@/modules/bordro/hooks/use-personel";
import { PERSONEL_DEFAULT_VALUES, PersonelForm } from "./PersonelFormType";
import { toast } from "sonner";
import { useCurrentContext } from "@/modules/core/hooks/use-context";
import { PERSONEL_STEPS, PersonelFormFields } from "./PersonelFormFields";
import { Stepper } from "@/components/ui/stepper";
import { personelSchema } from "@/modules/bordro/schemas/personel/personel.schema";

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
    resolver: zodResolver(personelSchema),
  });

  // ---- Adımlar ------------------------------------------------------------
  // Eklemede: İleri'de o adım doğrulanır, stepper'dan sadece daha önce
  // ulaşılmış adımlara gidilebilir, Kaydet son adımda çıkar.
  // Düzenlemede: bütün adımlar serbest, Kaydet her adımda görünür.
  const [activeStep, setActiveStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  // Dialog kapanınca ilk adıma dön (effect yerine render sırasında —
  // React'ın "prop değişince state sıfırlama" önerisi)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setActiveStep(0);
      setMaxReachedStep(0);
    }
  }
  const lastStep = PERSONEL_STEPS.length - 1;
  const isLastStep = activeStep === lastStep;
  const { errors } = form.formState;

  const stepHasError = (index: number, errs: FieldErrors<PersonelForm>) =>
    PERSONEL_STEPS[index].fields.some((field) => Boolean(errs[field]));

  const goToStep = (index: number) => {
    setActiveStep(index);
    setMaxReachedStep((max) => Math.max(max, index));
  };

  /** Aktif adımı doğrular; geçerliyse hedef adıma geçer. */
  const validateAndGoTo = async (index: number) => {
    const isValid = await form.trigger([...PERSONEL_STEPS[activeStep].fields]);
    if (!isValid) {
      toast.error("Lütfen bu adımdaki zorunlu alanları kontrol edin.");
      return;
    }
    goToStep(index);
  };

  const handleStepClick = (index: number) => {
    // Geri gitmek ve düzenleme modu doğrulama istemez
    if (isEditMode || index < activeStep) goToStep(index);
    else validateAndGoTo(index);
  };

  // Eklemede son adıma kadar Enter formu submit etmesin, İleri gibi çalışsın.
  // Sadece bu formun kendi input'larına bakıyoruz — portal'daki arama
  // kutuları (select/combobox) kendi Enter'larını yönetiyor.
  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    const target = event.target;
    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      isEditMode ||
      isLastStep ||
      !(target instanceof HTMLInputElement) ||
      target.form !== event.currentTarget
    ) {
      return;
    }
    event.preventDefault();
    validateAndGoTo(activeStep + 1);
  };

  useEffect(() => {
    if (!open) {
      form.reset(PERSONEL_DEFAULT_VALUES);
      return;
    }

    if (isEditMode && personel) {
      form.reset({
        IDBolum: personel.IDBolum ? String(personel.IDBolum) : "0",
        IDSirketPersonelGrup: personel.IDSirketPersonelGrup
          ? String(personel.IDSirketPersonelGrup)
          : "0",
        SicilNo: personel.SicilNo ?? "",
        TcKimlikNo: personel.TcKimlikNo ?? "",
        Ad: personel.Ad ?? "",
        Soyad: personel.Soyad ?? "",
        IlkSoyad: personel.IlkSoyad ?? "",
        Cinsiyet: personel.Cinsiyet ?? "",
        DogumTarihi: personel.DogumTarihi?.slice(0, 10) ?? "",
        DogumYeri: personel.DogumYeri ?? "",
        MedeniDurum: personel.MedeniDurum ?? "",
        Uyruk:
          personel.Uyruk != null
            ? String(personel.Uyruk)
            : PERSONEL_DEFAULT_VALUES.Uyruk,
        KanGurubu: personel.KanGurubu ?? "",
        OgrenimDurumu:
          personel.OgrenimDurumu != null
            ? String(personel.OgrenimDurumu)
            : "51",
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
        SgkDurumu:
          personel.SgkDurumu != null
            ? String(personel.SgkDurumu)
            : PERSONEL_DEFAULT_VALUES.SgkDurumu,
        IstihdamDurumu:
          personel.IstihdamDurumu != null
            ? String(personel.IstihdamDurumu)
            : PERSONEL_DEFAULT_VALUES.IstihdamDurumu,
        CalismaDurumu:
          personel.CalismaDurumu != null
            ? String(personel.CalismaDurumu)
            : PERSONEL_DEFAULT_VALUES.CalismaDurumu,
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
            : "0",
        GecmistenDevredenIzinGun:
          personel.GecmistenDevredenIzinGun != null
            ? String(personel.GecmistenDevredenIzinGun)
            : "0",

        Ucret: personel.Ucret != null ? String(personel.Ucret) : "",
        MaasParaBirimi:
          personel.MaasParaBirimi != null
            ? String(personel.MaasParaBirimi)
            : PERSONEL_DEFAULT_VALUES.MaasParaBirimi,
        OdemeSekli:
          personel.OdemeSekli != null
            ? String(personel.OdemeSekli)
            : PERSONEL_DEFAULT_VALUES.OdemeSekli,
        UcretTipi:
          personel.UcretTipi != null
            ? String(personel.UcretTipi)
            : PERSONEL_DEFAULT_VALUES.UcretTipi,
        GunlukUcret:
          personel.GunlukUcret != null ? String(personel.GunlukUcret) : "",
        SaatlikUcret:
          personel.SaatlikUcret != null ? String(personel.SaatlikUcret) : "",
        SozlesmeUcret:
          personel.SozlesmeUcret != null ? String(personel.SozlesmeUcret) : "",
        SozlesmeOdemeSekli:
          personel.SozlesmeOdemeSekli != null
            ? String(personel.SozlesmeOdemeSekli)
            : PERSONEL_DEFAULT_VALUES.SozlesmeOdemeSekli,
        SozlesmeUcret2:
          personel.SozlesmeUcret2 != null
            ? String(personel.SozlesmeUcret2)
            : "",
        SozlesmeOdemeSekli2:
          personel.SozlesmeOdemeSekli2 != null
            ? String(personel.SozlesmeOdemeSekli2)
            : PERSONEL_DEFAULT_VALUES.SozlesmeOdemeSekli2,
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
            : "0",
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
        // Backend "7" veya "5-7" ('-' ile ayrılmış günler) döner; boşsa hafta tatili yok
        HaftaTatilGunu:
          personel.HaftaTatilGunu && String(personel.HaftaTatilGunu) !== "0"
            ? String(personel.HaftaTatilGunu)
            : "",
        IDBanka: personel.IDBanka != null ? String(personel.IDBanka) : "",
        BankaSubeKodu: personel.BankaSubeKodu ?? "",
        BankaHesapNo: personel.BankaHesapNo ?? "",
        BankaIbanNo: personel.BankaIbanNo ?? "",
        PersonelMeslekKodu: personel.PersonelMeslekKodu ?? "",
        PersonelSgkBelgeTuru:
          personel.PersonelSgkBelgeTuru != null
            ? String(personel.PersonelSgkBelgeTuru)
            : PERSONEL_DEFAULT_VALUES.PersonelSgkBelgeTuru,
        PersonelKanunNo:
          personel.PersonelKanunNo != null
            ? String(personel.PersonelKanunNo)
            : PERSONEL_DEFAULT_VALUES.PersonelKanunNo,
        PersonelGorevKodu:
          personel.PersonelGorevKodu != null
            ? String(personel.PersonelGorevKodu)
            : "",
        PersonelSigortaKolu:
          personel.PersonelSigortaKolu != null
            ? String(personel.PersonelSigortaKolu)
            : PERSONEL_DEFAULT_VALUES.PersonelSigortaKolu,
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
    const getApiResult = (
      result: unknown,
    ): { test?: unknown; sonuc?: string } => {
      if (Array.isArray(result)) {
        const first = result[0];
        if (first && typeof first === "object") {
          return first as { test?: unknown; sonuc?: string };
        }
      }

      if (result && typeof result === "object") {
        return result as { test?: unknown; sonuc?: string };
      }

      return {};
    };

    try {
      if (isEditMode && personel) {
        const result = await updatePersonel({
          ...values,
          IDSubePersonel: personel.IDSubePersonel,
          IDSube: personel.IDSube,
        });

        const apiResult = getApiResult(result);
        const testValue = Number(apiResult.test);
        if (testValue == 0) {
          toast.error(apiResult.sonuc || "Personel güncellenemedi.");
          return;
        }

        toast.success("Personel başarıyla güncellendi.");
      } else {
        const result = await createPersonel({
          ...values,
          IDSube: context?.IDSube,
        });

        const apiResult = getApiResult(result);
        const testValue = Number(apiResult.test);

        if (testValue == 0) {
          toast.error(apiResult.sonuc || "Personel oluşturulamadı.");
          return;
        }

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
      <DialogContent className="sm:max-w-4xl">
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
          <form
            onKeyDown={handleFormKeyDown}
            onSubmit={form.handleSubmit(handleSubmit, (submitErrors) => {
              const errorCount = Object.keys(submitErrors).length;
              // Hatalı ilk adıma götür ki kullanıcı hatayı görsün
              const firstErrorStep = PERSONEL_STEPS.findIndex((_, index) =>
                stepHasError(index, submitErrors),
              );
              if (firstErrorStep !== -1) setActiveStep(firstErrorStep);
              toast.error(
                `Lütfen zorunlu alanları kontrol edin (${errorCount} alanda hata var).`,
              );
            })}
          >
            <Stepper
              className="mt-2"
              steps={PERSONEL_STEPS.map((step, index) => ({
                id: step.id,
                label: step.label,
                hasError: stepHasError(index, errors),
              }))}
              activeStep={activeStep}
              onStepClick={handleStepClick}
              isStepClickable={(index) => isEditMode || index <= maxReachedStep}
            />

            <PersonelFormFields
              control={form.control}
              setValue={form.setValue}
              personel={personel}
              activeStep={activeStep}
            />

            <DialogFooter>
              <Button
                type="button"
                appearance="outline"
                onClick={() => onOpenChange(false)}
                className="sm:mr-auto"
              >
                İptal
              </Button>
              {activeStep > 0 && (
                <Button
                  type="button"
                  appearance="outline"
                  onClick={() => goToStep(activeStep - 1)}
                >
                  <ChevronLeft />
                  Geri
                </Button>
              )}
              {/* İleri ve Kaydet'e ayrı key: aynı DOM butonu type="button"dan
                  "submit"e dönerse İleri tıklaması formu submit edebiliyor. */}
              {!isLastStep && (
                <Button
                  key="next"
                  type="button"
                  appearance={isEditMode ? "outline" : undefined}
                  onClick={() => validateAndGoTo(activeStep + 1)}
                >
                  İleri
                  <ChevronRight />
                </Button>
              )}
              {(isEditMode || isLastStep) && (
                <Button key="submit" type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  Kaydet
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
