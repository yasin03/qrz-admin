"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
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
import { usePersonelDetay } from "@/hooks/use-personel";
import { useIlceler, useIller } from "@/hooks/use-il-ilce-vergi-data";
import { PERSONEL_DEFAULT_VALUES, PersonelForm } from "./PersonelFormType";
import { useSabitTanimlar } from "@/hooks/use-sabit-tanimlar";

function currentValueOption(value: unknown) {
  if (value === null || value === undefined || value === "") return [];
  return [{ value: String(value), label: String(value) }];
}

const CINSIYET_OPTIONS = [
  { label: "Kadın", value: "KADIN" },
  { label: "Erkek", value: "ERKEK" },
];

const currentYear = new Date().getFullYear();
const MEZUNIYET_YILI_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const year = String(currentYear - i);
  return { label: year, value: year };
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verilirse düzenleme modu — o personelin bilgileri çekilip forma yansıtılır. */
  id?: string | number | null;
};

export default function PersonelEkle({ open, onOpenChange, id }: Props) {
  const isEditMode = Boolean(id);

  const {
    data: personel,
    isLoading,
    isError,
  } = usePersonelDetay(open && isEditMode ? (id ?? undefined) : undefined);

  const form = useForm<PersonelForm>({
    defaultValues: PERSONEL_DEFAULT_VALUES,
  });

  const selectedIlKodu = form.watch("IlKodu");
  const { data: iller = [] } = useIller();
  const { data: ilceler = [] } = useIlceler(selectedIlKodu || undefined);

  const {
    sgkDurumlari,
    istihdamDurumlari,
    ucretTipleri,
    odemeSekilleri,
    sozlesmeOdemeSekilleri,
    sozlesmeOdemeSekilleri2,
    maasParaBirimleri,
    calismaDurumlari,
    ogrenimDurumlari,
    medeniDurumlar,
    kanGruplari,
    uyruklar,
  } = useSabitTanimlar();

  useEffect(() => {
    if (form.formState.isDirty) {
      form.setValue("IlceKodu", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIlKodu]);

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
        OgrenimDurumu: personel.OgrenimDurumu ?? "",
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

  // TODO seçenek listeleri — gerçek lookup API'leri gelince kaldırılacak.

  const personelAyrilisKoduOptions = useMemo(
    () => currentValueOption(personel?.PersonelAyrilisKodu),
    [personel],
  );
  const istisnaDurumOptions = useMemo(
    () => currentValueOption(personel?.IDPersonelIstisnaDurum),
    [personel],
  );
  const agiOranIDOptions = useMemo(
    () => currentValueOption(personel?.AgiOranID),
    [personel],
  );
  const idBankaOptions = useMemo(
    () => currentValueOption(personel?.IDBanka),
    [personel],
  );
  const personelGorevKoduOptions = useMemo(
    () => currentValueOption(personel?.PersonelGorevKodu),
    [personel],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    console.log("Form submitted:", form.getValues());
    // NOT: ADD_PERSONEL / UPDATE_PERSONEL proc'ları henüz verilmedi.
    // Proc'lar gelince burada gerçek useCreatePersonel/useUpdatePersonel
    // mutasyonu çağrılacak, "Kaydet" butonu da aktif hale gelecek.
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <Accordion
              type="multiple"
              defaultValue={["personel"]}
              className="w-full"
            >
              {/* ---- Personel Bilgileri ---- */}
              <AccordionItem value="personel">
                <AccordionTrigger>
                  <span className="text-sm font-semibold text-foreground">
                    Personel Bilgileri
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-1 sm:grid-cols-2">
                    <FormInput
                      control={form.control}
                      name="SicilNo"
                      label="Sicil No"
                    />
                    <FormInput
                      control={form.control}
                      name="TcKimlikNo"
                      label="TC Kimlik No"
                      format="tcno"
                    />
                    <FormInput
                      control={form.control}
                      name="Ad"
                      label="Ad"
                      format="text"
                    />
                    <FormInput
                      control={form.control}
                      name="Soyad"
                      label="Soyad"
                      format="text"
                    />
                    <FormInput
                      control={form.control}
                      name="IlkSoyad"
                      label="İlk Soyad"
                      format="text"
                    />
                    <FormSelect
                      control={form.control}
                      name="Cinsiyet"
                      label="Cinsiyet"
                      options={CINSIYET_OPTIONS}
                    />
                    <FormInput
                      control={form.control}
                      name="DogumTarihi"
                      label="Doğum Tarihi"
                      type="date"
                    />
                    <FormInput
                      control={form.control}
                      name="DogumYeri"
                      label="Doğum Yeri"
                    />
                    <FormSelect
                      control={form.control}
                      name="MedeniDurum"
                      label="Medeni Durum"
                      options={medeniDurumlar}
                    />
                    <FormSelect
                      control={form.control}
                      name="Uyruk"
                      label="Uyruk"
                      options={uyruklar}
                    />
                    <FormSelect
                      control={form.control}
                      name="KanGurubu"
                      label="Kan Grubu"
                      options={kanGruplari}
                    />
                    <FormSelect
                      control={form.control}
                      name="OgrenimDurumu"
                      label="Öğrenim Durumu"
                      options={ogrenimDurumlari}
                    />
                    <FormSelect
                      control={form.control}
                      name="MezuniyetYili"
                      label="Mezuniyet Yılı"
                      options={MEZUNIYET_YILI_OPTIONS}
                    />
                    <FormInput
                      control={form.control}
                      name="MezuniyetBolumu"
                      label="Mezuniyet Bölümü"
                    />
                    <FormInput
                      control={form.control}
                      name="Boy"
                      label="Boy (cm)"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="Kilo"
                      label="Kilo (kg)"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="Yas"
                      label="Yaş"
                      format="number"
                      disabled
                    />
                    <FormInput
                      control={form.control}
                      name="KimlikKartiSeriNo"
                      label="Kimlik Kartı Seri No"
                    />
                    <FormInput
                      control={form.control}
                      name="KimlikKartiDuzenlemeTarihi"
                      label="Kimlik Kartı Düzenleme Tarihi"
                      type="date"
                    />
                    <FormInput
                      control={form.control}
                      name="KimlikKartiBitisTarihi"
                      label="Kimlik Kartı Bitiş Tarihi"
                      type="date"
                    />
                    <FormSwitch
                      control={form.control}
                      name="OzurluDurumu"
                      label="Özürlü Durumu"
                    />
                    <FormInput
                      control={form.control}
                      name="OzurlulukDerecesi"
                      label="Özürlülük Derecesi"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="Aciklama"
                      label="Açıklama"
                      className="sm:col-span-2"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ---- Giriş/Çıkış Bilgileri ---- */}
              <AccordionItem value="giris-cikis">
                <AccordionTrigger>
                  <span className="text-sm font-semibold text-foreground">
                    Giriş/Çıkış Bilgileri
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-1 sm:grid-cols-2">
                    <FormInput
                      control={form.control}
                      name="IseIlkGirisTarihi"
                      label="İşe İlk Giriş Tarihi"
                      type="date"
                    />
                    <FormInput
                      control={form.control}
                      name="IseSonGirisTarihi"
                      label="İşe Son Giriş Tarihi"
                      type="date"
                    />
                    <FormInput
                      control={form.control}
                      name="CikisTarihi"
                      label="Çıkış Tarihi"
                      type="date"
                    />
                    <FormSwitch
                      control={form.control}
                      name="Durum"
                      label="Durum (Aktif)"
                    />
                    <FormSelect
                      control={form.control}
                      name="SgkDurumu"
                      label="SGK Durumu"
                      options={sgkDurumlari}
                    />
                    <FormSelect
                      control={form.control}
                      name="IstihdamDurumu"
                      label="İstihdam Durumu"
                      options={istihdamDurumlari}
                    />
                    <FormSelect
                      control={form.control}
                      name="CalismaDurumu"
                      label="Çalışma Durumu"
                      options={calismaDurumlari}
                    />
                    <FormSelect
                      control={form.control}
                      name="PersonelAyrilisKodu"
                      label="Ayrılış Kodu"
                      options={personelAyrilisKoduOptions}
                    />
                    <FormSelect
                      control={form.control}
                      name="IDPersonelIstisnaDurum"
                      label="İstisna Durumu"
                      options={istisnaDurumOptions}
                    />
                    <FormInput
                      control={form.control}
                      name="IstisnaDurumBilgi"
                      label="İstisna Durum Bilgisi"
                    />
                    <FormInput
                      control={form.control}
                      name="IstisnaDurumTarih"
                      label="İstisna Durum Tarihi"
                      type="date"
                    />
                    <FormSwitch
                      control={form.control}
                      name="IskurKayit"
                      label="İşkur Kayıtlı"
                    />
                    <FormInput
                      control={form.control}
                      name="IskurKayitNo"
                      label="İşkur Kayıt No"
                    />
                    <FormSwitch
                      control={form.control}
                      name="AzCalismaDurumu"
                      label="Az Çalışma Durumu"
                    />
                    <FormSwitch
                      control={form.control}
                      name="AzCalismaDurumuGun"
                      label="Az Çalışma (Gün Bazlı)"
                    />
                    <FormInput
                      control={form.control}
                      name="AzCalismaDurumuGunSayisi"
                      label="Az Çalışma Gün Sayısı"
                      format="number"
                    />
                    <FormSwitch
                      control={form.control}
                      name="EskiHukumluDurumu"
                      label="Eski Hükümlü Durumu"
                    />
                    <FormSwitch
                      control={form.control}
                      name="SendikaDurumu"
                      label="Sendika Durumu"
                    />
                    <FormInput
                      control={form.control}
                      name="SendikaBaslangicTarihi"
                      label="Sendika Başlangıç Tarihi"
                      type="date"
                    />
                    <FormSwitch
                      control={form.control}
                      name="DayanismaDurumu"
                      label="Dayanışma Durumu"
                    />
                    <FormInput
                      control={form.control}
                      name="DayanismaBaslangicTarihi"
                      label="Dayanışma Başlangıç Tarihi"
                      type="date"
                    />
                    <FormInput
                      control={form.control}
                      name="GecmistenKalanIzinGun"
                      label="Geçmişten Kalan İzin (Gün)"
                      format="number"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ---- Bordro Bilgileri ---- */}
              <AccordionItem value="bordro">
                <AccordionTrigger>
                  <span className="text-sm font-semibold text-foreground">
                    Bordro Bilgileri
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-1 sm:grid-cols-2">
                    <FormInput
                      control={form.control}
                      name="Ucret"
                      label="Ücret"
                      format="number"
                    />
                    <FormSelect
                      control={form.control}
                      name="MaasParaBirimi"
                      label="Maaş Para Birimi"
                      options={maasParaBirimleri}
                    />
                    <FormSelect
                      control={form.control}
                      name="OdemeSekli"
                      label="Ödeme Şekli"
                      options={odemeSekilleri}
                    />
                    <FormSelect
                      control={form.control}
                      name="UcretTipi"
                      label="Ücret Tipi"
                      options={ucretTipleri}
                    />
                    <FormInput
                      control={form.control}
                      name="GunlukUcret"
                      label="Günlük Ücret"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="SaatlikUcret"
                      label="Saatlik Ücret"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="SozlesmeUcret"
                      label="Sözleşme Ücreti"
                      format="number"
                    />
                    <FormSelect
                      control={form.control}
                      name="SozlesmeOdemeSekli"
                      label="Sözleşme Ödeme Şekli"
                      options={sozlesmeOdemeSekilleri}
                    />
                    <FormInput
                      control={form.control}
                      name="SozlesmeUcret2"
                      label="Sözleşme Ücreti 2"
                      format="number"
                    />
                    <FormSelect
                      control={form.control}
                      name="SozlesmeOdemeSekli2"
                      label="Sözleşme Ödeme Şekli 2"
                      options={sozlesmeOdemeSekilleri2}
                    />
                    <FormInput
                      control={form.control}
                      name="Ucret2"
                      label="Ücret 2"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="GunlukUcret2"
                      label="Günlük Ücret 2"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="SaatlikUcret2"
                      label="Saatlik Ücret 2"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="NetUcret"
                      label="Net Ücret"
                      format="number"
                    />
                    <FormSwitch
                      control={form.control}
                      name="AsgeriUcretli"
                      label="Asgari Ücretli"
                    />
                    <FormSwitch
                      control={form.control}
                      name="AgiAlmazDurumu"
                      label="AGİ Almaz Durumu"
                    />
                    <FormInput
                      control={form.control}
                      name="AgiOrani"
                      label="AGİ Oranı"
                      format="number"
                    />
                    <FormSelect
                      control={form.control}
                      name="AgiOranID"
                      label="AGİ Oran Grubu"
                      options={agiOranIDOptions}
                    />
                    <FormSwitch
                      control={form.control}
                      name="BesKesilmezDurumu"
                      label="BES Kesilmez Durumu"
                    />
                    <FormInput
                      control={form.control}
                      name="BesOrani"
                      label="BES Oranı"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="DevredenSgkMatrahi"
                      label="Devreden SGK Matrahı"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="KumulatifSgkMatrahi"
                      label="Kümülatif SGK Matrahı"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="AuKumulatifVergiMatrahi"
                      label="Kümülatif Vergi Matrahı"
                      format="number"
                    />
                    <FormInput
                      control={form.control}
                      name="TesvikOrani"
                      label="Teşvik Oranı"
                      format="number"
                    />
                    <FormSwitch
                      control={form.control}
                      name="VergidenMuaf"
                      label="Vergiden Muaf"
                    />
                    <FormSwitch
                      control={form.control}
                      name="YardimHaric"
                      label="Yardım Hariç"
                    />
                    <FormSwitch
                      control={form.control}
                      name="AgiHaric"
                      label="AGİ Hariç"
                    />
                    <FormSwitch
                      control={form.control}
                      name="MaliMesuliyet"
                      label="Mali Mesuliyet"
                    />
                    <FormSwitch
                      control={form.control}
                      name="CocukYardimiAlamaz"
                      label="Çocuk Yardımı Alamaz"
                    />
                    <FormSwitch
                      control={form.control}
                      name="BordroIstisnaUygulama"
                      label="Bordro İstisna Uygulama"
                    />
                    <FormSwitch
                      control={form.control}
                      name="UcretOtomatikIsle"
                      label="Ücret Otomatik İşle"
                    />
                    <FormInput
                      control={form.control}
                      name="UcretOdemeGun"
                      label="Ücret Ödeme Günü"
                      format="number"
                    />
                    <FormSwitch
                      control={form.control}
                      name="HastalikRiskPrimDurumu"
                      label="Hastalık Risk Primi"
                    />
                    <FormSelect
                      control={form.control}
                      name="IDBanka"
                      label="Banka"
                      options={idBankaOptions}
                    />
                    <FormInput
                      control={form.control}
                      name="BankaSubeKodu"
                      label="Banka Şube Kodu"
                    />
                    <FormInput
                      control={form.control}
                      name="BankaHesapNo"
                      label="Banka Hesap No"
                    />
                    <FormInput
                      control={form.control}
                      name="BankaIbanNo"
                      label="Banka IBAN No"
                    />
                    <FormInput
                      control={form.control}
                      name="PersonelMeslekKodu"
                      label="Meslek Kodu"
                    />
                    <FormInput
                      control={form.control}
                      name="PersonelSgkBelgeTuru"
                      label="SGK Belge Türü"
                    />
                    <FormInput
                      control={form.control}
                      name="PersonelKanunNo"
                      label="Kanun No"
                    />
                    <FormSelect
                      control={form.control}
                      name="PersonelGorevKodu"
                      label="Görev Kodu"
                      options={personelGorevKoduOptions}
                    />
                    <FormInput
                      control={form.control}
                      name="PersonelSigortaKolu"
                      label="Sigorta Kolu"
                    />
                    <FormInput
                      control={form.control}
                      name="GorevAdi"
                      label="Görev Adı"
                    />
                    <FormInput
                      control={form.control}
                      name="UnvanAdi"
                      label="Unvan Adı"
                    />
                    <FormInput
                      control={form.control}
                      name="OzelKod"
                      label="Özel Kod"
                    />
                    <FormInput
                      control={form.control}
                      name="OzelKod2"
                      label="Özel Kod 2"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ---- Adres Bilgileri ---- */}
              <AccordionItem value="adres">
                <AccordionTrigger>
                  <span className="text-sm font-semibold text-foreground">
                    Adres Bilgileri
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-1 sm:grid-cols-2">
                    <FormInput
                      control={form.control}
                      name="Adres"
                      label="Adres"
                      className="sm:col-span-2"
                    />
                    <FormInput
                      control={form.control}
                      name="Telefon"
                      label="Telefon"
                      format="tel"
                    />
                    <FormSelect
                      control={form.control}
                      name="IlKodu"
                      label="İl"
                      options={iller}
                      valueKey="IlKodu"
                      labelKey="IlAdi"
                    />
                    <FormSelect
                      control={form.control}
                      name="IlceKodu"
                      label="İlçe"
                      options={ilceler}
                      valueKey="IlceKodu"
                      labelKey="IlAdi"
                      disabled={!selectedIlKodu}
                    />
                    <FormInput
                      control={form.control}
                      name="IDLokasyon"
                      label="Lokasyon"
                    />
                    <FormInput
                      control={form.control}
                      name="Koordinatorluk"
                      label="Koordinatörlük"
                    />
                    <FormInput
                      control={form.control}
                      name="CalismaAlani"
                      label="Çalışma Alanı"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

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
